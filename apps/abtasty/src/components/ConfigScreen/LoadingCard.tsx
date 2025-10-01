import { Card, CardContent, Skeleton, Stack } from '@mui/material';


export const LoadingCard = () => (
  <Card sx={{ width: '100%', height: 220 }}>
    <CardContent>
      <Stack direction="column" spacing={2}>
        <Skeleton variant="text" width={420} height={46} />
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="rounded" height={28} />
        <Skeleton variant="rounded" height={28} width={350} />
      </Stack>
    </CardContent>
  </Card>
);