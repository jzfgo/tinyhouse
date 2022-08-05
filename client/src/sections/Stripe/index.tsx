import { useMutation } from '@apollo/client';
import { Spin } from 'antd';
import { Content } from 'antd/lib/layout/layout';
import { useEffect, useRef } from 'react';
import { Redirect, RouteComponentProps } from 'react-router-dom';
import { CONNECT_STRIPE } from '../../lib/graphql/mutations';
import {
  ConnectStripe as ConnectStripeData,
  ConnectStripeVariables,
} from '../../lib/graphql/mutations/ConnectStripe/__generated__/ConnectStripe';
import { Viewer } from '../../lib/types';
import { displaySuccessNotification } from '../../lib/utils';

interface Props {
  viewer: Viewer;
  setViewer: (viewer: Viewer) => void;
}

export const Stripe = ({
  viewer,
  setViewer,
  location,
  history,
}: Props & RouteComponentProps) => {
  const [connectStripe, { data, loading, error }] = useMutation<
    ConnectStripeData,
    ConnectStripeVariables
  >(CONNECT_STRIPE, {
    onCompleted: (data) => {
      if (data && data.connectStripe) {
        setViewer({ ...viewer, ...data.connectStripe });
        displaySuccessNotification(
          'You have successfully connected your Stripe account!',
          'You can now begin to create listings in the Host page.'
        );
      }
    },
  });
  const connectStripeRef = useRef(connectStripe);

  useEffect(() => {
    const { search } = location;
    const params = new URLSearchParams(search);
    const code = params.get('code');

    if (code) {
      connectStripeRef.current({
        variables: {
          input: {
            code,
          },
        },
      });
    } else {
      history.replace('/login');
    }
  }, [location, history]);

  if (loading) {
    return (
      <Content className="stripe">
        <Spin tip="Connecting your Stripe account…" />
      </Content>
    );
  }

  if (error) {
    return <Redirect to={`/user/${viewer.id}?stripe_error=true`} />;
  }

  if (data && data.connectStripe) {
    return <Redirect to={`/user/${viewer.id}`} />;
  }

  return null;
};
