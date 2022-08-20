import { Input, Layout } from 'antd';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Viewer } from '../../lib/types';
import { displayErrorMessage } from '../../lib/utils';
import logo from './assets/tinyhouse-logo.png';
import { MenuItems } from './components';

interface Props {
  viewer: Viewer;
  setViewer: (viewer: Viewer) => void;
}

const { Header } = Layout;
const { Search } = Input;

export const AppHeader = ({ viewer, setViewer }: Props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  useEffect(() => {
    const { pathname } = location;
    const search = pathname.startsWith('/listings/')
      ? pathname.split('/')[2]
      : '';

    setSearch(search);
    return;
  }, [location]);

  const onSearch = (value: string) => {
    const trimmedValue = value.trim();

    if (trimmedValue) {
      navigate(`/listings/${trimmedValue}`);
    } else {
      return displayErrorMessage('Please enter a valid search!');
    }
  };

  return (
    <Header className="app-header">
      <div className="app-header__logo-search-section">
        <div className="app-header__logo">
          <Link to="/">
            <img src={logo} alt="logo" />
          </Link>
        </div>
        <div className="app-header__search-input">
          <Search
            placeholder="Search 'San Francisco'"
            enterButton
            size="large"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onSearch={onSearch}
          />
        </div>
      </div>
      <div className="app-header__menu-section">
        <MenuItems viewer={viewer} setViewer={setViewer} />
      </div>
    </Header>
  );
};
