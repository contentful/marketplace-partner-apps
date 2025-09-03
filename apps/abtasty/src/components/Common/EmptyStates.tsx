import { Stack } from '@mui/material';
import Typography from '@mui/material/Typography';
import { CustomButton } from '@/locations/ConfigScreen';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

export const LoadingSessionView = () => (
  <Stack justifyContent="center" alignItems="center" height="100%" sx={{ padding: '20px' }}>
    <Typography variant="body1">Loading session...</Typography>
  </Stack>
);

export const NotSignedInView = ({ onOpenConfig }: { onOpenConfig: () => void;}) => (
  <Stack
    justifyContent="center"
    alignItems="center"
    height="100%"
    spacing={2}
    sx={{ padding: '24px', textAlign: 'center', marginTop: 20 }}
  >
    <Stack direction="row" spacing={1} alignItems="center">
      <SettingsOutlinedIcon fontSize="large" sx={{ color: '#3100BF' }} />
      <Typography variant="h6" fontWeight="bold">
        You’re not signed in to AB Tasty
      </Typography>
    </Stack>

    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 520 }}>
      Open the app configuration to connect your AB Tasty account and continue using the editor.
    </Typography>
    <Stack direction="row" spacing={1}>
      <CustomButton variant="contained" onClick={onOpenConfig}>
        Open configuration
      </CustomButton>
    </Stack>
  </Stack>
);

export const IncompleteConfigView = ({ onOpenConfig }: { onOpenConfig: () => void }) => (
  <div style={{ width: '100%', padding: 20 }}>
    <Stack spacing={2} alignItems="center" justifyContent="center">
      <Typography variant="h6" fontWeight="bold">
        Configuration incomplète
      </Typography>
      <Typography variant="body1" align="center">
        You should complete the configuration before using this app.
      </Typography>
      <CustomButton variant="contained" onClick={onOpenConfig}>
        Go to configuration
      </CustomButton>
    </Stack>
  </div>
);