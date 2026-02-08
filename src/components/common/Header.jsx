import { SearchIcon, ActivityIcon, BarChartIcon } from './Icons';
import './Header.css';

const Header = () => {
  return (
    <header className="app-header">
      <div className="header-content">
        {/* Logo and Title */}
        <div className="header-left">
          <div className="logo">
            <ActivityIcon />
          </div>
          <div className="header-text">
            <h1 className="header-title">Working Productivity</h1>
            <p className="header-subtitle">Let's check your progress</p>
          </div>
        </div>

        {/* Search */}
        <div className="header-center">
          <div className="search-container">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search for anything"
              className="search-input"
            />
          </div>
        </div>

        {/* Right side - Icons */}
        <div className="header-right">
          <button className="icon-btn">
            <BarChartIcon />
          </button>
          <div className="profile-avatar">
            <span>U</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
