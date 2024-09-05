# Building Pitcher CatalogIQ Apps

This repository is a collection of examples for building apps for Pitcher CatalogIQ.

The examples are kept simple and built using very simple, vanilla JavaScript to make it easier to understand the
concepts without distractions.

## Getting Started

- clone this repository
- copy [pitcher_config.sh.example](pitcher_config.sh.example) to `pitcher_config.sh` and fill in the required values.
  - `PITCHER_DOMAIN` is the part of your CatalogIQ organization domain just before `.my`. E.g.
    for `https://example.my.pitcher.com` it would be `example`.
  - `PITCHER_API_KEY` is the API key you generated in the CatalogIQ Admin.
    Follow [this guide](https://developer.pitcher.com/guide/testing-and-deployment.html#api-tokens) to generate an API
    key.
  - `PITCHER_INSTANCE_ID` is the ID of the instance where you want to deploy the app. You can find this ID in the URL
    when you open the instance in CatalogIQ Admin. E.g.
    for `https://example.my.pitcher.com/admin/instances/03HUJNRWDB0VVS0XCJ5JPGDM5` the ID would
    be `03HUJNRWDB0VVS0XCJ5JPGDM5`.
- navigate to the app directory, make some changes, and deploy it to your CatalogIQ instance
  ```
  cd apps_db_canvas_populator
  ../deploy.sh
  ```
- open the app in your CatalogIQ instance and see the changes.

To run back-end of the `green_app` app, you need to have Node.js installed. Then start the server:

```
cd green_app_backend
npm install
npm start
```

## Apps

### [apps_db_data_admin](apps_db_data_admin)

This app demonstrates how to create admin-only app. This app allows to read and write arbitrary JSON data to a REST API endpoint. In this case we use Pitcher's own Apps DB endpoint but it could be any other REST API.

The flow is as follows:

- app loads data from the rest end point
- admin can edit the data
- admin can save the data back to the endpoint

### [apps_db_canvas_populator](apps_db_canvas_populator)

This app demonstrates how to populate canvas context with data from external sources. In this case the data is fetched from two places

- REST API endpoint - we read the data from the same endpoint as in the `apps_db_data_admin` app. This is to demonstrate how to share data between apps and how can canvas context be populated with arbitrary data set by the admin.
- Salesforce SOQL query - we use Salesforce API to fetch data from Salesforce

The flow is as follows:

- the app is added to every canvas and listens to changes
- app loads data from Salesforce
- app loads data from the rest end point
- app populates canvas context with the data

### [green_app](green_app)

Pitcher apps can be anything. We can even make them green! This app demonstrates how to prepare an application that can feed files into CatalogIQ on demand, ensuring the user always sees the latest version.

The flow is as follows:

- app is added to the canvas manually by the user
- app has a button that initiates the file generation and upload into pitcher
  - if the file for a given account already exists, it is updated
  - if the file does not exist, it is created
- the file details are returned to the app
- a button shows up that allows the user to open the file in Pitcher

### [canvas_proxy](canvas_proxy)

This app demonstrates how to create a proxy that allows loading external web applications within a CatalogIQ canvas. It uses an iframe to load the external content and provides a bridge for the external app to communicate with the Pitcher API.

The flow is as follows:

- The app is added to a canvas in CatalogIQ
- It loads an external web application in an iframe
- The external app can communicate with the Pitcher API through a message-passing mechanism

Please note that for security reasons the proxy app should always validate if the origin of the iframe messages being sent and received.

### [canvas_proxy_external_target_app](canvas_proxy_external_target_app)

This is a sample external web application that can be loaded inside the `canvas_proxy` app. It demonstrates how to interact with the Pitcher API from an external application.

The flow is as follows:

- The app is served by a simple Express.js server
- It provides a user interface with buttons to test the Pitcher API and UI API
- When a button is clicked, it sends a message to the parent window (canvas_proxy)
- The canvas_proxy then executes the API call and returns the result

To run the external target app:

```
cd canvas_proxy_external_target_app
npm install
npm start
```

Then, update the `proxyTarget` URL in the `canvas_proxy/index.html` file to point to `http://localhost:3456`.

These two apps together showcase how to integrate external web applications within CatalogIQ while maintaining access to the Pitcher API functionality.
