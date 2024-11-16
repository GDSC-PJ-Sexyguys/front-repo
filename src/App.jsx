import React, { useState, useEffect } from "react";
import "./App.css"; // CSS 파일 import
import logo from "./logo.png";
//import axios from "axios"; // Axios import

function App() {
  const [activeMenu, setActiveMenu] = useState("홈");

  const handleMenuClick = (menu) => {
    setActiveMenu(menu);
  };

  return (
    <div className="container">
      <header className="header">
        <img src={logo} className="logo" alt="Logo" />
        <h1>강의실 예약 시스템</h1>
      </header>
      <div className="menu">
        <div
          className={`menu-item ${activeMenu === "대강의실" ? "active" : ""}`}
          onClick={() => handleMenuClick("대강의실")}
        >
          대강의실
        </div>
        <div
          className={`menu-item ${activeMenu === "소강의실" ? "active" : ""}`}
          onClick={() => handleMenuClick("소강의실")}
        >
          소강의실
        </div>
        <div
          className={`menu-item ${activeMenu === "내정보" ? "active" : ""}`}
          onClick={() => handleMenuClick("내정보")}
        >
          내정보
        </div>
      </div>
      <div className="content">
        {/* 조건부 렌더링 */}
        {activeMenu === "대강의실" && <BigReservation />}
        {activeMenu === "소강의실" && <SmallReservation />}
        {activeMenu === "내정보" && <UserInfoContent />}
      </div>
    </div>
  );
}

function BigReservation() {
  const [modalInfo, setModalInfo] = useState({
    isOpen: false,
    title: "",
    content: null,
  });

  const rooms = [
    { roomName: "제1열람실", totalSeats: 407, reservedSeats: 54 },
    { roomName: "제2열람실", totalSeats: 300, reservedSeats: 75 },
  ];

  const openModal = (title, content) => {
    setModalInfo({ isOpen: true, title, content });
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setModalInfo({ isOpen: false, title: "", content: null });
    document.body.style.overflow = "auto";
  };

  return (
    <div className="reservations-container">
      {rooms.map((room, index) => (
        <ReservationCircle
          key={index}
          roomName={room.roomName}
          totalSeats={room.totalSeats}
          reservedSeats={room.reservedSeats}
          onClick={() =>
            openModal(
              room.roomName,
              `${room.reservedSeats} / ${room.totalSeats} seats reserved`,
            )
          }
        />
      ))}
      {modalInfo.isOpen && (
        <Modal
          title={modalInfo.title}
          content={modalInfo.content}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
function SmallReservation() {
  const [modalInfo, setModalInfo] = useState({
    isOpen: false,
    title: "",
    content: null,
  });
  const rooms = [
    { roomName: "제3열람실", totalSeats: 200, reservedSeats: 100 },
    { roomName: "제4열람실", totalSeats: 150, reservedSeats: 40 },
  ];

  const openModal = (title, content) => {
    setModalInfo({ isOpen: true, title, content });
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setModalInfo({ isOpen: false, title: "", content: null });
    document.body.style.overflow = "auto";
  };

  return (
    <div className="reservations-container">
      {rooms.map((room, index) => (
        <ReservationCircle
          key={index}
          roomName={room.roomName}
          totalSeats={room.totalSeats}
          reservedSeats={room.reservedSeats}
          onClick={() =>
            openModal(
              room.roomName,
              `${room.reservedSeats} / ${room.totalSeats} seats reserved`,
            )
          }
        />
      ))}
      {modalInfo.isOpen && (
        <Modal
          title={modalInfo.title}
          content={modalInfo.content}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

function ReservationCircle({ roomName, totalSeats, reservedSeats, onClick }) {
  const availableSeats = totalSeats - reservedSeats;
  const percentage = (reservedSeats / totalSeats) * 100;

  return (
    <div className="seat-reservation" onClick={onClick}>
      <div className="circle-container">
        <svg className="seat-circle" viewBox="0 0 36 36">
          <circle className="background-circle" cx="18" cy="18" r="15.915" />
          <circle
            className="progress-circle"
            cx="18"
            cy="18"
            r="15.915"
            strokeDasharray={`${percentage} ${100 - percentage}`}
            strokeDashoffset="25"
          />
        </svg>
        <div className="seat-text">
          <div className="available-seats">{availableSeats}</div>
          <div className="seat-info">
            {reservedSeats} / {totalSeats}
          </div>
        </div>
      </div>
      <div className="room-name">{roomName}</div>
    </div>
  );
}

function UserInfoContent() {
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");

  const handleLogin = () => {
    alert(`이름: ${name}, 학번: ${studentId}`);
    // 로그인 로직 추가
  };

  return (
    <div className="user-info">
      <h2>로그인</h2>
      <input
        type="text"
        placeholder="이름"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="input-field"
      />
      <input
        type="text"
        placeholder="학번"
        value={studentId}
        onChange={(e) => setStudentId(e.target.value)}
        className="input-field"
      />
      <button onClick={handleLogin} className="login-button">
        로그인
      </button>
    </div>
  );
}

// 모달 컴포넌트
function Modal({ title, content, onClose }) {
  return (
    <div className="modal-bg">
      <div className="modal">
        <div className="modal-header">
          <h2>{title}</h2>
          <span
            className="close"
            onClick={() => {
              // 디버깅 로그
              console.log("Closing modal...");
              onClose(); // onClose 호출
            }}
          >
            &times;
          </span>
        </div>
        <div className="modal-content">{content}</div>
      </div>
    </div>
  );
}

//구매 모달 컴포넌트
const Pmodal = ({ id, itemName, content, closeModal }) => {
  const handlePurchase = () => {
    axios
      .post("/api/items", { itemName })
      .then((response) => {
        alert(`${itemName}를 구매하였습니다!`);
        console.log("구매 요청 성공:", response.data);
      })
      .catch((error) => {
        console.error("구매 요청 중 오류 발생:", error);
      });
  };

  return (
    <div className="modal-bg">
      <div className="modal">
        <div className="modal-header">
          <h2>{itemName}</h2>
          <span className="close" onClick={closeModal}>
            &times;
          </span>
        </div>
        <div className="modal-content">
          <p>{content}</p>
          <button className="purchase-button" onClick={handlePurchase}>
            구매
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
