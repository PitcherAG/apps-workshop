const api = pitcher.useAdmin()

let instanceEditor = null
let instanceId = ''
let env = {}

async function getData(instanceId, storeName, token) {
  const getUrl = `/api/v1/appsdb/stores/${storeName}/instances/${instanceId}/globals/entries/json/`
  try {
    const response = await fetch(getUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
    if (!response.ok) {
      throw new Error(`Error fetching data: ${response.statusText}`)
    }
    return (await response.json()) || null
  } catch (error) {
    console.error('Error:', error.message)
    return null
  }
}

async function updateData(instanceId, storeName, token, data) {
  const postUrl = `/api/v1/appsdb/stores/${storeName}/instances/${instanceId}/globals/entries/json/`
  try {
    const postResponse = await fetch(postUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ value: data }),
    })
    if (!postResponse.ok) {
      throw new Error(`Error updating data: ${postResponse.statusText}`)
    }
    console.log('Update successful:', await postResponse.json())
  } catch (error) {
    console.error('Error updating data:', error.message)
  }
}

document.addEventListener('DOMContentLoaded', function () {
  const instanceContainer = document.getElementById('instance-json-editor')

  instanceEditor = new JSONEditor(instanceContainer, {})

  api.getEnv().then(function (result) {
    env = result
    instanceId = env.pitcher.instance.id
    getData(
      env.pitcher.instance.id,
      'datapoc',
      env.pitcher.access_token,
    ).then(function (data) {
      var jsonResponse = {}
      if (data?.value) {
        try {
          jsonResponse = data.value
        } catch (e) {
          console.error('Error parsing JSON:', e)
        }
      }
      instanceEditor.set(jsonResponse)
    })
  })

  // Save instance settings
  document
    .getElementById('save-instance-settings')
    .addEventListener('click', function () {
      const updatedJson = instanceEditor.get()
      updateData(
        env.pitcher.instance.id,
        'datapoc',
        env.pitcher.access_token,
        updatedJson
      );
    });
})
