import {
  BankOutlined,
  HomeOutlined,
  LoadingOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useMutation } from '@apollo/client';
import {
  Button,
  Form,
  Input,
  InputNumber,
  Layout,
  Radio,
  Typography,
  Upload,
} from 'antd';
import type { UploadChangeParam } from 'antd/lib/upload';
import type {
  RcFile,
  UploadFile,
  UploadProps,
} from 'antd/lib/upload/interface';
import { useState } from 'react';
import { Link, Redirect } from 'react-router-dom';
import { ListingType } from '../../lib/graphql/globalTypes';
import { HOST_LISTING } from '../../lib/graphql/mutations';
import { Viewer } from '../../lib/types';
import {
  displayErrorMessage,
  displaySuccessNotification,
  iconColor,
} from '../../lib/utils';
import {
  HostListing as HostListingData,
  HostListingVariables,
} from '../../lib/graphql/mutations/HostListing/__generated__/HostListing';

interface Props {
  viewer: Viewer;
}

const { Content } = Layout;
const { Text, Title } = Typography;
const { Item } = Form;

export const Host = ({ viewer }: Props) => {
  const [form] = Form.useForm();

  const [imageLoading, setImageLoading] = useState(false);
  const [imageBase64Value, setImageBase64Value] = useState<string | null>(null);

  const [hostListing, { loading, data }] = useMutation<
    HostListingData,
    HostListingVariables
  >(HOST_LISTING, {
    onCompleted: () => {
      displaySuccessNotification('You have successfully created your listing!');
    },
    onError: () => {
      displayErrorMessage(
        "Sorry! We weren't able to create your listing. Please try again later."
      );
    },
  });

  const handleImageUpload: UploadProps['onChange'] = (
    info: UploadChangeParam<UploadFile>
  ) => {
    const { file } = info;

    if (file.status === 'uploading') {
      setImageLoading(true);
      return;
    }

    if (file.status === 'done' && file.originFileObj) {
      getBase64Value(file.originFileObj as RcFile, (imageBase64Value) => {
        setImageBase64Value(imageBase64Value);
        setImageLoading(false);
      });
    }
  };

  const handleHostListing = (values: any) => {
    const fullAddress = `${values.address}, ${values.city}, ${values.state}, ${values.postalCode}`;

    const input = {
      ...values,
      address: fullAddress,
      image: imageBase64Value,
      price: values.price * 100,
    };
    delete input.city;
    delete input.state;
    delete input.postalCode;

    hostListing({
      variables: {
        input,
      },
    });
  };

  const handleHostListingFailed = (errors: any) => {
    if (errors.errorFields && errors.errorFields.length) {
      displayErrorMessage('Please complete all required form fields!');
      return;
    }
  };

  if (!viewer.id || !viewer.hasWallet) {
    return (
      <Content className="host-content">
        <div className="host__form-header">
          <Title level={4} className="host__form-title">
            You'll have to be signed in and connected with Stripe to host a
            listing!
          </Title>
          <Text type="secondary">
            We only allow users who've signed in to our application and have
            connected with Stripe to host new listings. You can sign in at the{' '}
            <Link to="/login">login</Link> page and connect with Stripe shortly
            after.
          </Text>
        </div>
      </Content>
    );
  }

  if (loading) {
    return (
      <Content className="host-content">
        <div className="host__form-header">
          <Title level={3} className="host__form-title">
            Please wait!
          </Title>
          <Text type="secondary">We are creating your listing now.</Text>
        </div>
      </Content>
    );
  }

  if (data && data.hostListing) {
    return <Redirect to={`/listings/${data.hostListing.id}`} />;
  }

  return (
    <Content className="host-content">
      <Form
        layout="vertical"
        form={form}
        name="host_form"
        onFinish={handleHostListing}
        onFinishFailed={handleHostListingFailed}
      >
        <div className="host__form-header">
          <Title level={3} className="host__form-title">
            Hi! Let's get started listing your place.
          </Title>
          <Text type="secondary">
            In this form, we'll collect some basic and additional information
            about your listing.
          </Text>
        </div>

        <Item
          label="Home Type"
          name="type"
          rules={[{ required: true, message: 'Please select a home type!' }]}
        >
          <Radio.Group>
            <Radio.Button value={ListingType.APARTMENT}>
              <BankOutlined style={{ color: iconColor }} />
              &nbsp;
              <span>Apartment</span>
            </Radio.Button>
            <Radio.Button value={ListingType.HOUSE}>
              <HomeOutlined style={{ color: iconColor }} />
              &nbsp;
              <span>House</span>
            </Radio.Button>
          </Radio.Group>
        </Item>

        <Item
          label="Max # of Guests"
          name="numOfGuests"
          rules={[
            { required: true, message: 'Please enter a max number of guests!' },
          ]}
        >
          <InputNumber min={1} placeholder="4" />
        </Item>

        <Item
          label="Title"
          extra="Max character count of 45"
          name="title"
          rules={[
            {
              required: true,
              message: 'Please enter a title for your listing!',
            },
          ]}
        >
          <Input
            maxLength={45}
            placeholder="The iconic and luxurious Bel-Air mansion"
          />
        </Item>

        <Item
          label="Description"
          extra="Max character count of 400"
          name="description"
          rules={[
            {
              required: true,
              message: 'Please enter a description for your listing!',
            },
          ]}
        >
          <Input.TextArea
            maxLength={400}
            rows={3}
            placeholder="Modern, clean, and iconic home of the Fresh Prince. Situated in the heart of Bel-Air, Los Angeles."
          />
        </Item>

        <Item
          label="Address"
          name="address"
          rules={[
            {
              required: true,
              message: 'Please enter an address for your listing!',
            },
          ]}
        >
          <Input placeholder="251 North Bristol Avenue" />
        </Item>

        <Item
          label="City/Town"
          name="city"
          rules={[
            {
              required: true,
              message: 'Please enter a city or town for your listing!',
            },
          ]}
        >
          <Input placeholder="Los Angeles" />
        </Item>

        <Item
          label="State/Province"
          name="state"
          rules={[
            {
              required: true,
              message: 'Please enter a state or province for your listing!',
            },
          ]}
        >
          <Input placeholder="California" />
        </Item>

        <Item
          label="Zip/Postal Code"
          name="postalCode"
          rules={[
            {
              required: true,
              message: 'Please enter a zip or postal code for your listing!',
            },
          ]}
        >
          <Input placeholder="Please enter a zip code for your listing!" />
        </Item>

        <Item
          label="Image"
          extra="Images have to be under 1MB in size and of type JPG or PNG"
          name="image"
          rules={[
            {
              required: true,
              message: 'Please select an image for your listing!',
            },
          ]}
        >
          <div className="host__form-image-upload">
            <Upload
              name="image"
              listType="picture-card"
              className="image-uploader"
              showUploadList={true}
              action="https://www.mocky.io/v2/5cc8019d300000980a055e76"
              beforeUpload={beforeImageUpload}
              onChange={handleImageUpload}
            >
              {imageBase64Value ? (
                <img src={imageBase64Value} alt="listing" />
              ) : (
                <div>
                  {imageLoading ? <LoadingOutlined /> : <PlusOutlined />}
                  <div className="ant-upload-text">Upload</div>
                </div>
              )}
            </Upload>
          </div>
        </Item>

        <Item label="Price" extra="All prices in $USD/night">
          <InputNumber min={0} placeholder="120" />
        </Item>

        <Item>
          <Button type="primary" htmlType="submit">
            Submit
          </Button>
        </Item>
      </Form>
    </Content>
  );
};

const beforeImageUpload = (file: RcFile) => {
  const fileIsValidImage =
    file.type === 'image/jpeg' || file.type === 'image/png';
  const isValidImageSize = file.size / 1024 / 1024 < 1;

  if (!fileIsValidImage) {
    displayErrorMessage("You're only allowed to upload JPG or PNG images!");
    return false;
  }

  if (!isValidImageSize) {
    displayErrorMessage("You're only allowed to upload images under 1MB!");
    return false;
  }

  return fileIsValidImage && isValidImageSize;
};

const getBase64Value = (
  img: RcFile,
  callback: (imageBase64Value: string) => void
) => {
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result as string));
  reader.readAsDataURL(img);
};
