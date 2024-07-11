const express = require('express')
const axios = require('axios')
const cors = require('cors')
const FormData = require('form-data')
const fs = require('fs')
const fsPromises = require('fs').promises
const os = require('os')
const path = require('path')
const PDFDocument = require('pdfkit')

const app = express()
const port = 3123

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(function setCommonHeaders(req, res, next) {
  res.set('Access-Control-Allow-Private-Network', 'true')
  next()
})
app.use(cors())

// Function to make HTTP requests using axios
async function makeRequest(url, method, headers, data) {
  try {
    const response = await axios({
      method,
      url,
      headers: { accept: 'application/json', ...headers },
      data,
    })
    return response.data
  } catch (error) {
    console.error(
      'Error making request:',
      error.response?.data || error.message,
    )
    throw error
  }
}

// Function to check if a file already exists based on type and UID
function checkIfFileAlreadyExists(file, type, uid) {
  return file.tags && file.tags.includes(`file_type:${type}`) && file.tags.includes(`uid:${uid}`)
}

async function sendToPitcher(pdfPath, type, uid, files, token, instanceId, folderId) {
  const fileFound = files.find(file => checkIfFileAlreadyExists(file, type, uid))
  let fileId = fileFound ? fileFound.id : null

  const baseUrl = 'https://dev.my.pitcher.com/api/v1/files/'
  const headers = {
    Authorization: `Bearer ${token}`,
  }

  const pdfBuffer = await fsPromises.readFile(pdfPath)

  if (!fileId) {
    console.log('File doesn\'t exist, creating new one...')
    const formData = new FormData()
    formData.append('is_asset', 'false')
    formData.append('instance_id', instanceId)
    formData.append('folder_id', folderId)
    formData.append('name', `${uid} / ${type}`)
    formData.append('content', pdfBuffer, {
      filename: path.basename(pdfPath),
      contentType: 'application/pdf',
    })
    formData.append('access_type', 'public')

    const response = await axios.post(baseUrl, formData, {
      headers: { ...headers, ...formData.getHeaders() },
    })
    fileId = response.data.id

    const patchData = {
      metadata: { uid },
      tags: [ `file_type:${type}`, `uid:${uid}` ],
    }
    await axios.patch(`${baseUrl}${fileId}/`, patchData, {
      headers: { ...headers, 'Content-Type': 'application/json' },
    })
    console.log('File created')
  } else {
    console.log('File exists, updating pdf...')
    const formData = new FormData()
    formData.append('content', pdfBuffer, {
      filename: path.basename(pdfPath),
      contentType: 'application/pdf',
    })

    await axios.patch(`${baseUrl}${fileId}/`, formData, {
      headers: {
        ...headers,
        ...formData.getHeaders(),
      },
    })
    console.log('File updated')
  }

  return fileId
}

// Function to create PDF content with user name, client name, and current date
async function createPDFContent(userName, clientName, outputPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument()
    const stream = fs.createWriteStream(outputPath)

    doc.pipe(stream)
    doc.fontSize(18).text('Hello, World!', { align: 'center' })
    doc.moveDown()
    doc.fontSize(14).text(`User Name: ${userName}`)
    doc.text(`Client Name: ${clientName}`)
    doc.text(`Date: ${new Date().toISOString()}`)
    doc.end()

    stream.on('finish', resolve)
    stream.on('error', reject)
  })
}

// Main route handler
app.post('/', async (req, res) => {
  try {
    const { userName, clientName, instanceId, folderId, token } = req.body
    console.log('New request:', { userName, clientName, instanceId, folderId })

    if (userName && clientName) {
      // Create temporary file for PDF
      const pdfFile = path.join(os.tmpdir(), `pdf_${Date.now()}.pdf`)
      console.log('Creating pdf')
      // Generate PDF content
      await createPDFContent(userName, clientName, pdfFile)
      console.log('Pdf created')
      // Retrieve folder information from Pitcher
      const url = `https://dev.my.pitcher.com/api/v1/folders/${folderId}/`
      const headers = {
        Authorization: `Bearer ${token}`,
      }
      const response = await makeRequest(url, 'GET', headers)
      console.log('File list fetched')
      // Send PDF to Pitcher and get file ID
      const fileId = await sendToPitcher(pdfFile, 'ClientData', clientName, response.files, token, instanceId, folderId)
      res.send(fileId.toString())

      // Clean up temporary file
      await fsPromises.unlink(pdfFile)
    } else {
      res.status(400).send('Invalid input.')
    }
  } catch (error) {
    console.error('Error processing request:', error)
    res.status(500).send('Internal server error.')
  }
})

let globalData = { value: null }

app.get('/data', (req, res) => {
  try {
    res.json({ value: globalData.value })
  } catch (error) {
    console.error('Error reading data:', error)
    res.status(500).send('Internal server error.')
  }
})

// Example curl command to update data:
// curl -X POST http://localhost:3123/data -H "Content-Type: application/json" -d '{"value": "your_value_here"}'
app.post('/data', (req, res) => {
  try {
    const { value } = req.body
    if (value === undefined) {
      return res.status(400).send('Invalid input.')
    }

    globalData.value = value
    res.json({ value })
  } catch (error) {
    console.error('Error updating data:', error)
    res.status(500).send('Internal server error.')
  }
})

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})
