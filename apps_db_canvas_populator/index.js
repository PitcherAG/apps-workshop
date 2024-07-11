const api = window.api = pitcher.usePitcherApi()
const uiApi = window.uiApi = pitcher.useUi()

async function getData(instanceId, token) {
  const getUrl = `/api/v1/appsdb/stores/datapoc/instances/${instanceId}/globals/entries/json/`
  try {
    const response = await fetch(getUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      },
    })
    if (!response.ok) throw new Error(`Error fetching data: ${response.statusText}`)
    return await response.json() || null
  } catch (error) {
    console.error('Error:', error.message)
    return null
  }
}

window.pitcherData = {}

async function fetchSalesforceDataAndAddToContext(context, currentCanvas, env) {
  try {
    let connectedServices = env.pitcher.user.connected_services
    let sfdc = connectedServices[0]
    let sfdcDomain = sfdc?.urls?.custom_domain
    let sfdcToken = sfdc?.access_token
    let sfdcConn = new jsforce.Connection({
      instanceUrl: sfdcDomain,
      accessToken: sfdcToken,
    })

    const sfdcResult = await sfdcConn.query(`SELECT Name FROM Account WHERE Id = '${currentCanvas.account.id}'`)

    console.log('Populating account Name:', sfdcResult.records[0].Name)
    context.customSFData = sfdcResult.records[0].Name
  } catch (e) {
    console.error('Error caught', e)
  }
}

let contextUpdated = false
uiApi.on_canvas_updated(async (data) => {
  if (contextUpdated) return
  contextUpdated = true

  const currentCanvas = data.canvas
  window.pitcherData.canvas = currentCanvas

  api.getEnv().then(async function (env) {
    window.env = env
    let context = currentCanvas.context

    await fetchSalesforceDataAndAddToContext(context, currentCanvas, env)

    // get from apps db
    const result = await getData(env.pitcher.instance.id, env.pitcher.access_token)
    if (result?.value) {
      context.customData = result.value
      console.log('Populating canvas context', context)

      uiApi.update_canvas({ fields: 'context', context })
        .then(function (result) {
          console.log('Canvas Context Populated.', result.context)
          window.uiApi.toast({
            message: 'Canvas Context Populated.',
            type: 'info',
          })
        })
    }
  })
})