import symbol_light_background from './assets/symbol_light_background.png';
// create a footer component

function Footer() {
  return (
    <div className="footer">
      <p>
        <a href="https://github.com/constellation-load-testing" target="_blank">
        <img style={{height:"100px"}} className='header image' src={symbol_light_background} alt="logo" />
      </a>
      </p>
    </div>
  );
}

export default Footer;
