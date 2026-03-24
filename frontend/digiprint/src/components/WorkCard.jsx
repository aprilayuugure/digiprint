import { useNavigate } from "react-router-dom";
import { Card, Image } from "react-bootstrap";
import "../css/work-card.css";
import { getServerFileUrl } from "../utils/fileUtils";
import { FaHeart } from "react-icons/fa";

function WorkCard({ work }) {
    const navigate = useNavigate();
    
    return (
        <Card className = "work-card"
              style = {{ cursor: "pointer" }}
        >
            <Card.Img variant = "top"
                      src = {getServerFileUrl(work.thumbnail, "/images/no_image.jpg")}
                      style = {{ objectFit: "cover", height: "200px" }}
                      onClick = {() => navigate(`/work/${work.workId}`)}
            />

            <div className="work-card-like-row">
                <div className="work-card-like-inner">
                    <span className="work-card-like-heart" aria-label="Likes">
                        <FaHeart />
                    </span>
                    <span className="work-card-like-count">{work?.likeCount ?? 0}</span>
                </div>
            </div>

            <Card.Body>
                <div className="d-flex align-items-center">
                    <Image
                        src={getServerFileUrl(work.avatar, "/images/no_avatar.jpg")}
                        roundedCircle
                        width={32}
                        height={32}
                        className="me-2"
                        style={{ cursor: "pointer" }}
                        onClick={() => navigate(`/artist/${work.creator}`)}
                    />

                    <span
                        style={{ cursor: "pointer" }}
                        onClick={() => navigate(`/artist/${work.creator}`)}
                    >
                        {work.creator}
                    </span>
                </div>
            </Card.Body>
        </Card>
    )

}

export default WorkCard;