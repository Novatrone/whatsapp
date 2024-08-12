import React, { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { Image } from 'react-bootstrap';
import { getAdminDetails } from '../../service/whatsappApi';

export default function MainLayout({ children }) {
    const [user, setUser] = useState(null);

    const getAllMassages = async () => {
        try {
            const result = await getAdminDetails();
            if (result && result.data && result.data[0]) {
                setUser(result.data[0]);
            }
        } catch (error) {
            console.error('Error fetching WhatsApp account details:', error);
        }
    }

    useEffect(() => {
        getAllMassages();
    }, []);

    return (
        <div className="d-flex flex-column overflow-hidden vh-100">
            <Navbar className="border-bottom" data-bs-theme="light">
                <Container fluid>
                    <Navbar.Brand href="#home">WhatsApp</Navbar.Brand>
                    <Nav className="me-auto">
                        <Nav.Link href="#home">Home</Nav.Link>
                        <Nav.Link href="#features">Features</Nav.Link>
                    </Nav>
                    {user && (
                        <>
                            <Image width={40} src="https://wallpapers.com/images/hd/naruto-profile-pictures-sa1tekghfajrr928.jpg" roundedCircle />
                            <div className="user-info d-flex ms-2 flex-column">
                                <span style={{ fontSize: "14px", fontWeight: 600 }}>{user.verified_name}</span>
                                <span style={{ fontSize: "11px", color: "GrayText" }}>{user.display_phone_number}</span>
                            </div>
                        </>
                    )}
                </Container>
            </Navbar>
            <div className="flex-grow-1">
                {children}
            </div>
        </div>
    )
}
