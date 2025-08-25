import { Stack, Flex, Text } from "@contentful/f36-components";
import { InfoCircleIcon } from '@contentful/f36-icons';

export default function RenderInformation(props: { text: string }) {
    return <Stack>
        <Flex alignItems="center" style={{ padding: "3em" }}>
            <InfoCircleIcon size="medium" /> <Text>{props.text}</Text>
        </Flex>
    </Stack>
}
