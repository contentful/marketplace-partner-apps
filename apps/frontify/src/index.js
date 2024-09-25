import {setup} from '@contentful/dam-app-base';
import {create} from "@frontify/frontify-finder";

import logo from './logo.svg';

const CTA = 'Select files from Frontify';

setup({
    cta: CTA,
    name: 'Frontify',
    logo,
    color: '#363D4A',
    description:
        'The Frontify app enables editors to access all digital brand assets in Frontify directly from Contentful.',
    parameterDefinitions: [
        {
            id: 'domain',
            type: 'Symbol',
            name: 'Frontify Domain',
            description: 'Your Frontify domain, e.g. https://weare.frontify.com',
            default: 'https://weare.frontify.com',
            required: true,
        }
    ],
    makeThumbnail,
    renderDialog,
    openDialog,
    isDisabled,
    validateParameters,
});

function makeThumbnail(resource) {
    const url = resource.preview_url;
    const alt = resource.title;

    return [url, alt];
}

function renderDialog(sdk) {
    const config = sdk.parameters.invocation;
    document.getElementById('root').style.height = 700 + "px";

    const finderStart = async () => {
        const finder = await create({
            clientId: "contentful",
            domain: config.domain,
            options: {
                allowMultiSelect: true,
                permanentDownloadUrls: true
            }
        });
        finder.mount(document.getElementById('root'));
        sdk.window.startAutoResizer();

        finder.onAssetsChosen((assets) => {
            sdk.close(assets || []);
            document.getElementById('root').style.height = "auto";
            document.querySelector("iframe.frontify-finder-iframe")?.remove();
        });

        finder.onCancel(() => {
            sdk.notifier.error('Selection of assets was cancelled');
            document.getElementById('root').style.height = "auto";
            document.querySelector("iframe.frontify-finder-iframe")?.remove();
        });
    };

    finderStart().catch((err) => console.debug(err));
}

async function openDialog(sdk) {
    const params = sdk.parameters;

    const result = await sdk.dialogs.openCurrentApp({
        position: 'center',
        title: CTA,
        shouldCloseOnOverlayClick: true,
        shouldCloseOnEscapePress: true,
        parameters: {domain: params.installation.domain},
        width: 1400,
    });

    if (!Array.isArray(result)) {
        return [];
    }

    return result.map((item) => ({
        id: item.id,
        title: item.title,
        name: item.filename,
        ext: item.extension,
        height: item.height,
        width: item.width,
        created: item.createdAt,
        generic_url: item.downloadUrl,
        preview_url: item.previewUrl,
        src: item.previewUrl,
        metadataValues: item.metadataValues,
        focalPoint: item.focalPoint,
        pageCount: item.pageCount,
        tags: item.tags,
        copyright: item.copyright,
        licenses: item.licenses,
        description: item.description,
        type: item.type,
        appVersion: "2.0.0"
    }));
}


function isDisabled() {
    return false;
}

function validateParameters({domain}) {
    const hasValidProtocol = domain.startsWith('https://');
    const isHTMLSafe = ['"', '<', '>'].every((unsafe) => !domain.includes(unsafe));

    if (hasValidProtocol && isHTMLSafe) {
        return null;
    } else {
        return 'Provide a valid Frontify URL.';
    }
}
