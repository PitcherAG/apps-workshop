const api = pitcher.usePitcherApi()
const uiApi = pitcher.useUi()
window.api = api
let currentCanvas = null

let userName = null
let clientName = null

document.addEventListener('DOMContentLoaded', function () {
  uiApi.app_loaded()

  const generateButton = document.getElementById('generate-button')
  const loadingIndicator = document.getElementById('loading-indicator')
  const responseContainer = document.getElementById('response-container')

  generateButton.addEventListener('click', function (event) {
    event.preventDefault()
    generateButton.disabled = true
    loadingIndicator.classList.remove('hidden')

    fetch(localStorage.greenAppLocalBackend
      ? 'http://localhost:3123/'
      : 'https://analytics.pitcher.com/test/green_helloworld/generate_pdf.php', {
      method: 'POST',
      body: new URLSearchParams({
        userName,
        clientName,
        token: window.env.pitcher.access_token,
        instanceId: window.env.pitcher.instance.id,
        folderId: '01J1N752B5W1JTS87721R6VSKW',
      }),
    })
      .then((response) => response.text())
      .then((response) => {
        if (response.toLowerCase().startsWith('invalid')) {
          throw new Error(response)
        }

        loadingIndicator.classList.add('hidden')
        generateButton.disabled = false
        responseContainer.innerHTML = `<a href="javascript:launchFile('${response}')">View Document</a>`
      })
      .catch((error) => {
        loadingIndicator.classList.add('hidden')
        generateButton.disabled = false
        alert(
          'An error occurred while generating the document. Please try again.',
        )
      })
  })
})

function launchFile(fileId) {
  api.open({ fileID: fileId })
}

window.pitcherData = {}
uiApi.on_app_set_data((data) => {
  window.pitcherData = data
  currentCanvas = window.pitcherData.canvas
  api.getEnv().then(function (result) {
    window.env = result
    userName = window.env.pitcher.user.name
    clientName = currentCanvas.account ? currentCanvas.account.name : null

    if (userName && clientName) {
      document.getElementById(
        'user-name-display',
      ).textContent = `User Name: ${userName}`
      document.getElementById(
        'client-name-display',
      ).textContent = `Client Name: ${clientName}`
    } else {
      alert('Both user name and client name must be provided.')
    }
  })
})
