import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Button from 'react-bootstrap/Button';
import { Link } from 'react-router-dom';

const AdminNavbar = ({ isUser, logOut }) => {
    return (
        <Navbar expand="lg" bg="dark" data-bs-theme="dark">
            <Container>
                <Navbar.Brand as={Link} to="/">
                    <img
                        src="https://getbootstrap.com/docs/5.3/assets/brand/bootstrap-logo.svg"
                        alt="Bootstrap"
                        width="30"
                        height="24"
                        className="d-inline-block align-text-top"
                    />
                    {' '}Admin Control Panel
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link as={Link} to="/">Home</Nav.Link>
                        <Nav.Link as={Link} to="/link">Link</Nav.Link>
                        <NavDropdown title="Dropdown" id="basic-nav-dropdown">
                            <NavDropdown.Item as={Link} to="/action/3.1">Action</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/action/3.2">
                                Another action
                            </NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/action/3.3">Something</NavDropdown.Item>
                            <NavDropdown.Divider />
                            <NavDropdown.Item as={Link} to="/action/3.4">
                                Separated link
                            </NavDropdown.Item>
                        </NavDropdown>
                    </Nav>
                    <Nav>
                        {isUser ? (
                            <div className="d-flex align-items-center gap-3">
                                <Navbar.Text className="text-light">
                                    <span className="fw-bold">{isUser.name} {isUser.lastname}</span>
                                </Navbar.Text>
                                <Button 
                                    variant="outline-light" 
                                    as={Link} 
                                    onClick={logOut}
                                    to="/"
                                    className="px-3"
                                >
                                    ออกจากระบบ
                                </Button>
                            </div>
                        ) : (
                            <div className="d-flex gap-2">
                                <Button variant="outline-light" as={Link} to="/login">เข้าสู่ระบบ</Button>
                                <Button variant="light" as={Link} to="/register">สมัครสมาชิก</Button>
                            </div>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    )
}
export default AdminNavbar