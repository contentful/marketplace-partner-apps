import { Button, styled } from '@mui/material';

export const CustomPrimaryButton = styled(Button)({
  gap: '4px',
  padding: '4px 8px',
  minWidth: '96px',
  overflow: 'hidden',
  border: 'none #D8D8E2',
  color: '#FCFCFD',
  transition: '90ms',
});

export const CustomButton = styled(CustomPrimaryButton)({
  background: '#3100BF',
  textTransform: 'none',
  fontWeight: 'bold',
});

export const CustomButtonSecond = styled(CustomPrimaryButton)({
  textTransform: 'none',
  fontWeight: 'bold',
  color: '#3100BF',
});

export const CustomButtonDanger = styled(CustomPrimaryButton)({
  textTransform: 'none',
  border: '2px solid #b02f25',
  fontWeight: 'bold',
  color: '#fff',
});

export const CustomButtonSuccess = styled(CustomPrimaryButton)({
  textTransform: 'none',
  border: '2px solid #00806c',
  fontWeight: 'bold',
  color: '#00806c',
});
