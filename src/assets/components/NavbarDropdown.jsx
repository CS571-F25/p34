import { NavDropdown } from 'react-bootstrap'
import { Link } from 'react-router'

export default function NavbarDropdown() {
  return (
    <NavDropdown title="Tools" id="nav-tools">
      <NavDropdown.Item as={Link} to="/players">Players</NavDropdown.Item>
      <NavDropdown.Item as={Link} to="/league">Leagues</NavDropdown.Item>
      <NavDropdown.Item as={Link} to="/watchlist">Watchlist</NavDropdown.Item>
      <NavDropdown.Item as={Link} to="/nfl_data_py_testing">nfl_data_py test</NavDropdown.Item>
      <NavDropdown.Divider />
      <NavDropdown.Item as={Link} to="/about">About</NavDropdown.Item>
    </NavDropdown>
  )
}
