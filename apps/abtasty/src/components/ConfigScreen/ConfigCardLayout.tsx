import { Stack } from '@mui/material';

type Props = {
  children: React.ReactNode;
}

export const ConfigCardLayout = ({children}: Props) => {
  return (
    <div style={{background: '#ededed', minHeight: '350px'}}>
      <Stack maxWidth="800px" display="flex" justifyContent="center" alignItems="center" padding="60px" marginX={'auto'}>
        {children}
      </Stack>
    </div>

  )
}