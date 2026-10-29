# Mediaflow

Use Mediaflow files in Contentful entries. Editors pick a file from Mediaflow with the Mediaflow file selector in a JSON object field. The app copies the file to the Mediaflow CDN, stores its metadata (alt text, description, keywords, custom fields, dimensions, …) in the field, shows it in an asset card and keeps it in sync with Mediaflow.

The app authenticates against Mediaflow through a backend hosted by Mediaflow. The backend is not part of this repository.

## Setup guide

### What you need

- A Mediaflow account
- OAuth credentials for the app from Mediaflow: a client ID, a client secret and a refresh token. [Contact Mediaflow](https://www.mediaflow.com/en/contact/) to get them.
- A content type with at least one field of the type **JSON object** for each place editors should pick a Mediaflow file

### Install and configure

1. Install the Mediaflow app from the Contentful Marketplace and choose the space and environment.
2. On the configuration screen, enter the client ID, client secret and refresh token. The app can't be installed while one of them is empty.
3. Under **Assign to content types**, tick the JSON object fields that should hold Mediaflow files. Tick **Sidebar button** for content types where editors should be able to update all Mediaflow fields of an entry at once.
4. Leave **Show links to files in Mediaflow** on if your editors have Mediaflow accounts. Turn it off if they don't; the app then hides the links to Mediaflow.
5. Click **Install** (or **Save** when the app is already installed). The app checks the credentials and shows whether Mediaflow authentication succeeded. If it failed, correct the credentials on the same screen and save again.

To change the credentials or the assigned fields later, open the app's configuration screen again. Changing credentials doesn't need a reinstall.

### Use the app in an entry

- **Select asset** opens the Mediaflow file selector. After a file is picked, the app copies it to the Mediaflow CDN and stores its URL and metadata in the field.
- The asset card shows a preview, the alt text, keywords and whether the metadata is up to date. **Show all metadata** lists every metadata field.
- **Sync** updates the field with the current metadata from Mediaflow. The sidebar button does the same for every Mediaflow field in the entry.
- **Replace** picks another file, and the remove button clears the field.

### Use the field in your frontend

The field is a JSON object. Images and other files have a `url` on the Mediaflow CDN; videos have an `embedCode`. A shortened example:

```json
{
  "id": 5555191,
  "basetype": "image",
  "name": "DSCF8170",
  "filename": "DSCF8170.JPG",
  "url": "https://eu1.cdn.mediaflow.com/1/abc/DSCF8170.JPG",
  "width": 800,
  "height": 533,
  "altText": "Skyline of New York at dusk",
  "keywords": ["new york"],
  "isMediaflowAsset": true
}
```

The configuration screen lists every field and what it contains. Don't change these fields through the Content Management API; the app may not be able to read them afterwards.

## Data the app sends to Mediaflow

When a file is added to or removed from a field, the app reports the usage to Mediaflow, so the file's usage history in Mediaflow shows where it is used. Each report contains:

- the name of the editor (or their email address if no name is set)
- the space name, environment, content type and entry title
- a link to the entry in Contentful
- the field name, its locale if the field is localized, and the date

## Permissions and security

- The client secret and refresh token are stored as secret installation parameters. They pass through the administrator's browser only on the configuration screen, where they are entered and returned to Contentful when the app is saved. Editors' browsers never receive them: the backend reads them with the app's own identity.
- Requests from the app to the backend are signed by Contentful. The backend only returns a token for the space and environment the request was signed for.
- Mediaflow OAuth tokens can't be limited to the calls the app makes. Every editor's browser receives a Mediaflow access token for the account behind the credentials, valid for its normal lifetime. The app needs to read files and folders, create and delete CDN resources and report usage, and Mediaflow has no narrower token for that set of calls. Treat the credentials accordingly, and replace them on the configuration screen if they may have leaked.

## Support

- For help with the app, credentials or your Mediaflow account, [contact Mediaflow](https://www.mediaflow.com/en/contact/). Customers on a Pro plan can also reach support under **Help & Support** in Mediaflow.
- The [Mediaflow knowledge base](https://help.mediaflow.com/hc/en-gb) covers Mediaflow itself.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| App configuration | `src/locations/ConfigScreen.tsx` | Mediaflow OAuth credentials, the "Show links to files in Mediaflow" setting, and which JSON object fields and sidebars use the app |
| Entry field (JSON object) | `src/locations/Field.tsx` | Select, replace and remove a Mediaflow file, check and sync its metadata |
| Entry sidebar | `src/locations/Sidebar.tsx` | Sync the metadata of every Mediaflow field in the entry |
| Dialog | `src/locations/Dialog.tsx` | Hosts the Mediaflow file selector |

## Installation parameters

| ID | Type | Description |
|----|------|-------------|
| `clientId` | Short text | Mediaflow OAuth client ID |
| `clientSecret` | Secret | Mediaflow OAuth client secret |
| `refreshToken` | Secret | Mediaflow refresh token |
| `showMediaflowLinks` | Boolean (default `true`) | Show links to files in Mediaflow; turn off when editors have no Mediaflow access |

[Contact Mediaflow](https://www.mediaflow.com/en/contact/) to get OAuth credentials for your Mediaflow account.

## Development

| Command | What it does |
|---------|--------------|
| `npm run install-ci` | Install dependencies |
| `npm start` | Dev server on http://localhost:3000 |
| `npm run build` | Production build in `build/` |
| `npm run lint` | Type check and ESLint |
| `npm test` | Run the tests with coverage (`npm run test:watch` watches) |

The backend URL is set as `VITE_BACKEND_URL` in `.env.production` (must end with `/`).
