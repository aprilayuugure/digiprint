import { Container } from "react-bootstrap";
import "../css/footer.css";

function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="site-footer border-top bg-white mt-auto py-4 shadow-sm">
            <Container fluid>
                <p className="site-footer-copy mb-0 text-center">
                    © {year} DigiPrint. All rights reserved.
                </p>
            </Container>
        </footer>
    );
}

export default Footer;
