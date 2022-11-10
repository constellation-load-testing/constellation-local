import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import light_background from './assets/light_background.png';

function handleRegionSelection(e, setShownRegion) {
  setShownRegion(e);
}

function handleAggTimeSelection(e, setAggTime) {
  setAggTime(e);
}

function NavBar({ regions, setShownRegion, setAggTime }) {
  return (
    <Navbar variant="light" bg="light" expand="lg">
      <Container fluid>
        <Navbar.Brand>
          <a href="https://github.com/constellation-load-testing" target="_blank">
          <img style={{height:"100px"}} className='header image' src={light_background} alt="logo" />
          </a>
        </Navbar.Brand>
          <Nav>
            <NavDropdown
              id="nav-region-dropdown"
              title="Regions"
            style={{"paddingRight": "10px"}}
            menuVariant="dark"
            onSelect={(e) => handleRegionSelection(e, setShownRegion)}
          >
            {regions.map((region, i) => {
              return (
                <NavDropdown.Item key={i} eventKey={region} href={`#${region}`}  >
                  {region}
                </NavDropdown.Item>
              );
            }
            )}
          </NavDropdown>
          <NavDropdown
              id="nav-aggregate-dropdown"
              title="Aggregate Line Graph"
            style={{"paddingRight": "20px"}}
            menuVariant="dark"
            onSelect={(e) => handleAggTimeSelection(e, setAggTime)}
          >
            <NavDropdown.Item key="1" eventKey="1" href="#1">1</NavDropdown.Item>
            <NavDropdown.Item key="5" eventKey="5" href="#5">5</NavDropdown.Item>
            <NavDropdown.Item key="10" eventKey="10" href="#10">10</NavDropdown.Item>
          </NavDropdown>
        </Nav>
      </Container>
    </Navbar>
  );
}

export default NavBar;
