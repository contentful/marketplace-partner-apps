export interface IConvoxConnectProps {
    convoxDeployKey: string;
    isAuthenticated: boolean;
    hasAuthError: boolean;
    updateconvoxDeployKey: (token: string) => void;
}
