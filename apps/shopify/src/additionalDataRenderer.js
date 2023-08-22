import {LinkDataItemRenderer, MetaDataRenderer} from '@contentful/ecommerce-app-base';
import {Box, Caption, DateTime, TextLink} from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import {SKU_ID} from "./constants";

const NOT_AVAILABLE = 'Not available';

const createInventory = (quantityAvailable) => ({
    name: 'Inventory',
    value: quantityAvailable ? `${quantityAvailable} in stock` : NOT_AVAILABLE,
})

const createProductsCount = (productsCount) => ({
    name: 'Products',
    value: productsCount ?? NOT_AVAILABLE,
})

const createCreatedDate = (data) => ({
    name: 'Created',
    value: data ? <DateTime date={data}/> : NOT_AVAILABLE,
})

const createUpdatedDate = (data) => ({
    name: 'Updated',
    value: data ? <DateTime date={data}/> : NOT_AVAILABLE,
})

const createPrice = (value) => ({
    name: 'Price',
    value: value ?? NOT_AVAILABLE,
})

const createVendor = (vendor) => ({
    name: 'Vendor',
    value: vendor ?? NOT_AVAILABLE,
})

const createExternalLink = (href) => {
    return () => <LinkDataItemRenderer text={'More information'} href={href}/>
}

const footer = () => {
    return (
        <Box marginTop={'spacingXs'}>
            <Caption>
                Missing something?{' '}
                <TextLink
                    href={'https://contentful.typeform.com/shopify-app'}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        fontSize: tokens.fontSizeS,
                        verticalAlign: 'inherit',
                    }}>
                    Let us know
                </TextLink>
            </Caption>
        </Box>
    );
}

export const AdditionalDataRenderer = ({product}) => {
    const {additionalData, externalLink} = product;

    const firstColumn = {
        title: 'Shopify activity',
        items: [],
    }

    const columns = [firstColumn]

    if (additionalData.type === SKU_ID.collection) {
        firstColumn.items.push(createProductsCount(additionalData.productsCount))
        firstColumn.items.push(createUpdatedDate(additionalData.updatedAt))
        firstColumn.items.push(createExternalLink(externalLink))
    } else {
        firstColumn.items.push(createInventory(additionalData.quantityAvailable))
        firstColumn.items.push(createCreatedDate(additionalData.createdAt))
        firstColumn.items.push(createUpdatedDate(additionalData.updatedAt))

        const secondColumn = {
            title: 'Product information',
            items: [],
        }
        secondColumn.items.push(createPrice(additionalData.price))
        secondColumn.items.push(createVendor(additionalData.vendor))
        secondColumn.items.push(createExternalLink(externalLink))
        columns.push(secondColumn)
    }

    return (
        <>
            <MetaDataRenderer columns={columns} footer={footer}/>
            {/*<RawDataRenderer value={additionalData}/>*/}
        </>
    );
};
