**Image Hotspot Creator**

**On this document**

- Overview
- Requirements
- How does this app work?
- Where it can be used?

**Overview**

Hotspots Areas are interactive regions marked over an Image. Hotspot is an identifier marker within the hotspot area to help identify and draw attention to that specific point.

Image Hotspot Creator helps users setup hotspots areas, with customisable border colours, Hotspot link positions, customisable size, etc

![App Screenshot](https://www.sudoboat.com/_next/static/media/ihc-demo.6caba10a.png)

**Requirements**

To use this app,you will need:
 A content type with three fields in it.
- A field type of “Short Text”named “Title”.
- A field type of “Short Text”named “Image URL”.
- A field type of “JSON Object”named “hotspots”.

![](https://www.sudoboat.com/_next/static/media/ihc-field-type.75487808.png)

**How does the app work?**

- Once the installation of the custom application is completed, go to the content type and add the custom application to the entry editor.

![](https://www.sudoboat.com/_next/static/media/ihc-field.1cf44ff0.png)

- Add an entry to the respective content model

![](https://www.sudoboat.com/_next/static/media/ihc-inital.b16fd19e.png)

- Click on the crop icon and drag on the image to create interactive image hotspots 
- Details Regarding the created hotspot area are displayed on the right side of the sidebar 
- Click save button to save the hotspot or Cancel to remove it

![](	https://www.sudoboat.com/_next/static/media/ihc-demo.6caba10a.png)

- The left side bar displays the list of crated hotspots 
- Once the creation is completed move to the Editor of Contentful, and the values are updated in the fields as user created.

![](	https://www.sudoboat.com/_next/static/media/ihc-json.10385271.png)

The coordinates are,

- x - Top of the hotspot,
- y - Left of the hotspot,
- height - Height of the hotspot,
- width - Width of the hotspot,
- name - Name of the hotspot,
- borderColor - Color of the hotspot border,
- hotspotX - Top of the point inside the hotspot,
- hotspotY - Left of the point inside the hotspot.

These coordinates are stored as an array called hotspots in the json object field.

**Where it can be used?**

If a particular area in a picture has to be highlighted and an action like redirecting or opening a popup should be taken while clicking or hovering over the particular area, this Image hotspot creator will make it easier to reach the goal by modifying the json object.

**Example:**

1. If there is a picture that has a number of people in it, then it can be made as clicking on a person which redirect to his Instagram profile by adding a new key and value for the profile url in the json object and using that url a developer can make it interactive.
2. If there is a picture that consists of a Table, a chair, a laptop, mobile, etc.There should be a seperate key and value that has the url for every product,with those keys and values developer can make it interactive, When clicking on each object, there should be a popup that does some action, like displaying detailed information of that particular product or redirecting to the shopping page for that particular product.

This tool simplifies the process of adding interactivity and enhancing user experience in images by allowing user to define and manage hotspots with ease.

## Code Documentation
https://github.com/Sudoboat/image-hotspot-creator

## Local Installation

Clone the project

```bash
  git clone https://github.com/Sudoboat/image-hotspot-creator
```

Go to the project directory

```bash
  cd image-hotspot-creator
```

Install dependencies

```bash
  npm install -f
```

Start the server

```bash
  npm start
```
