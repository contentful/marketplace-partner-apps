import { Card, CardActions, CardContent, Stack, Typography } from '@mui/material';
import { CustomButton } from '@/locations/ConfigScreen';


type Props = { onLogin: () => void };


export const LoginCard = ({ onLogin }: Props) => (
  <Card sx={{ width: '100%', height: 220 }}>
    <Stack direction="column" spacing={2} alignItems="center" justifyContent="center">

      <CardContent sx={{ textAlign: 'center' }}>
        <Typography variant="h5" fontWeight="bold">Connect to ABTasty</Typography>
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          Connect your AB Tasty account to link your experiments with Contentful content. Just click below and grant access — it only takes a few seconds!
        </Typography>
      </CardContent>
      <CardActions sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CustomButton onClick={onLogin} variant="contained">Login with AB Tasty</CustomButton>
      </CardActions>
    </Stack>
  </Card>
);