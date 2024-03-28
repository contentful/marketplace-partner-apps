import { Button, Flex, Modal, Note } from "@contentful/f36-components";
import { appConfig } from "../../../appConfig";
import { useForm } from "react-hook-form";
import { ControlledTextInput } from "../../../components";
import { useEffect, useState } from "react";

export type ConnectModalData = {
    backendUrl: string;
    lochubUrl: string;
    username: string;
    password: string;
};

export type ConnectModalProps = {
    isShown: boolean;
    onClose: (token?: string) => void;
    connect: (data: ConnectModalData) => Promise<string>;
};

export const ConnectModal = ({ isShown, onClose, connect }: ConnectModalProps) => {
    const {
        handleSubmit,
        control,
        formState: { isDirty },
        watch,
    } = useForm<ConnectModalData>();
    const [note, setNote] = useState<string>();

    useEffect(() => {
        const subscription = watch(() => {
            setNote("");
        });
        return () => subscription.unsubscribe();
    }, [watch]);

    const onSubmit = async (data: ConnectModalData) => {
        try {
            const token = await connect(data);
            onClose(token);
        } catch {
            setNote(`Failed to connect to ${appConfig.name}. Please review the provided URL and
            credentials.`);
        }
    };

    return (
        <Modal onClose={() => onClose()} isShown={isShown}>
            {() => (
                <>
                    <Modal.Header title={`Connect ${appConfig.name}`} onClose={() => onClose()} />
                    <Modal.Content>
                        <Flex flexDirection="column" gap="spacingL">
                            <ControlledTextInput
                                control={control}
                                label={`${appConfig.name} Contentful plugin backend URL`}
                                helpText={`Provide the URL to your ${appConfig.name} Contentful plugin backend`}
                                name="backendUrl"
                                type="url"
                                defaultValue=""
                                placeholder="https://"
                                isRequired
                            />
                            <ControlledTextInput
                                control={control}
                                label={`${appConfig.name} URL`}
                                helpText={`Provide the URL to your ${appConfig.name} instance`}
                                name="lochubUrl"
                                type="url"
                                defaultValue=""
                                placeholder="https://"
                                isRequired
                            />
                            <ControlledTextInput
                                control={control}
                                label="Username"
                                helpText={`Provide the username to your ${appConfig.name} instance`}
                                name="username"
                                defaultValue=""
                                isRequired
                            />
                            <ControlledTextInput
                                control={control}
                                label="Password"
                                helpText={`Provide the password to your ${appConfig.name} instance`}
                                name="password"
                                defaultValue=""
                                type="password"
                                isRequired
                            />
                            {note && <Note variant="negative">{note}</Note>}
                        </Flex>
                    </Modal.Content>
                    <Modal.Controls>
                        <Button size="small" variant="transparent" onClick={() => onClose()}>
                            Cancel
                        </Button>
                        <Button
                            size="small"
                            variant="primary"
                            isDisabled={!isDirty}
                            onClick={handleSubmit(onSubmit)}
                        >
                            Connect
                        </Button>
                    </Modal.Controls>
                </>
            )}
        </Modal>
    );
};
