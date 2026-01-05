import { Button, styled } from '@mui/material';

export const CustomButton = styled(Button)({
  background: '#3100BF',
  textTransform: 'none',
  fontWeight: 'bold',
});

export const CustomButtonSecond = styled(Button)({
  textTransform: 'none',
  border: '2px solid #3100BF',
  fontWeight: 'bold',
  color: '#3100BF',
});

export const CustomButtonDanger = styled(Button)({
  textTransform: 'none',
  border: '2px solid #b02f25',
  fontWeight: 'bold',
  color: '#fff',
});

export const CustomButtonSuccess = styled(Button)({
  textTransform: 'none',
  border: '2px solid #00806c',
  fontWeight: 'bold',
  color: '#00806c',
});