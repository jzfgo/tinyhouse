import { message, notification } from 'antd';

export const displaySuccessNotification = (
  message: string,
  description?: string
) =>
  notification['success']({
    message,
    description,
    placement: 'topRight',
    style: {
      marginTop: 50,
    },
  });

export const displayErrorMessage = (error: string) => message.error(error);
