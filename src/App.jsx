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
          className={`menu-item ${activeMenu === "내 좌석" ? "active" : ""}`}
          onClick={() => handleMenuClick("내 좌석")}
        >
          내 좌석
        </div>
      </div>
      <div className="content">
        {activeMenu === "대강의실" && <BigReservation />}
        {activeMenu === "소강의실" && <SmallReservation />}
        {activeMenu === "내 좌석" && <UserInfoContent />}
      </div>
    </div>
  );
}

//대강의
function BigReservation() {
  const [modalInfo, setModalInfo] = useState({ isOpen: false, title: "", seats: [] });
  const [studentIdModal, setStudentIdModal] = useState({ isOpen: false, seatId: null, roomIndex: null });

  // 각 방의 좌석 데이터를 동적으로 생성
    const rooms = [
      createRoom("하120", 60, 28),
      createRoom("5남140", 40, 35),
      createRoom("하224", 60, 0),
    ];

  function createRoom(roomName, totalSeats, reservedSeats) {
    // 좌석 배열을 1번부터 순서대로 생성
    const seats = Array.from({ length: totalSeats }, (_, index) => ({
      id: index + 1,
      type: Math.random() < 0.3 ? "outlet" : "normal", // 30% 확률로 콘센트 자리
      reserved: index < reservedSeats, // 앞에서부터 reservedSeats만큼 예약됨
    }));
    return { roomName, totalSeats, reservedSeats, seats };
  }

    const openModal = (roomName, seats) => {
      setModalInfo({ isOpen: true, title: roomName, seats });
      document.body.style.overflow = "hidden";
    };

  const closeModal = () => {
    setModalInfo({ isOpen: false, title: "", seats: [] });
    document.body.style.overflow = studentIdModal.isOpen ? "hidden" : "auto";
  };

  const openStudentIdModal = (roomIndex, seatId) => {
    setStudentIdModal({ isOpen: true, seatId, roomIndex });
  };

  const closeStudentIdModal = () => {
    setStudentIdModal({ isOpen: false, seatId: null, roomIndex: null });
    document.body.style.overflow = modalInfo.isOpen ? "hidden" : "auto";
  };

  const handleReservation = (studentId) => {
    if (!studentId.trim()) {
      alert("학번을 입력해주세요.");
      return;
    }

    const { roomIndex, seatId } = studentIdModal;
    const updatedRooms = [...rooms];
    const room = updatedRooms[roomIndex];
    const seat = room.seats.find((seat) => seat.id === seatId);

    if (seat && !seat.reserved) {
      seat.reserved = true;
      room.reservedSeats += 1;
      setRooms(updatedRooms);
      closeModal();
      closeStudentIdModal();
      alert(`학번 ${studentId}으로 예약이 완료되었습니다.`);
    } else {
      alert("이미 예약된 좌석입니다.");
    }
  };

return (
    <div className="reservations-container">
      {rooms.map((room, index) => (
        <ReservationCircle
          key={index}
          roomName={room.roomName}
          totalSeats={room.totalSeats}
          reservedSeats={room.reservedSeats}
          onClick={() => openModal(room.roomName, room.seats)}
        />
      ))}

      {modalInfo.isOpen && (
        <Modal
          title={modalInfo.title}
          content={
            <SeatsGrid
              seats={modalInfo.seats}
              onSeatClick={(seatId) =>
                openStudentIdModal(
                  rooms.findIndex((room) => room.roomName === modalInfo.title),
                  seatId
                )
              }
            />
          }
          onClose={closeModal}
        />
      )}

      {studentIdModal.isOpen && (
        <StudentIdModal
          onSubmit={handleReservation}
          onClose={closeStudentIdModal}
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
    { roomName: "60주년510", totalSeats: 4, reservedSeats: 3 },
    { roomName: "60주년511", totalSeats: 4, reservedSeats: 0 },
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

// 좌석 상태를 보여주는 컴포넌트
function SeatsGrid({ seats, onSeatClick }) {
  return (
    <div className="seats-grid">
      {seats.map((seat) => (
        <div
          key={seat.id}
          className={`seat ${
            seat.reserved
              ? "reserved"
              : seat.type === "outlet"
              ? "outlet"
              : "normal"
          }`}
          onClick={() => !seat.reserved && onSeatClick(seat.id)}
        >
          {seat.id}
        </div>
      ))}
    </div>
  );
}

// 원형 컴포넌트 (각 방)
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

// 학번 입력 모달 컴포넌트
function StudentIdModal({ onSubmit, onClose }) {
  const [studentId, setStudentId] = useState("");

  const handleInputChange = (e) => {
    setStudentId(e.target.value);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSubmit(studentId);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>학번 입력</h2>
        <form onSubmit={handleFormSubmit}>
          <input
            type="text"
            placeholder="학번을 입력하세요"
            value={studentId}
            onChange={handleInputChange}
          />
          <button type="submit">확인</button>
        </form>
        <button onClick={onClose}>취소</button>
      </div>
    </div>
  );
}

function UserInfoContent() {
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");

  const handleLogin = () => {
    alert(`학번: ${studentId}`);
    // 로그인 로직 추가
  };

  return (
    <div className="user-info">
      <h2>내 좌석 조회</h2>
      <input
        type="text"
        placeholder="학번"
        value={studentId}
        onChange={(e) => setStudentId(e.target.value)}
        className="input-field"
      />
      <button onClick={handleLogin} className="login-button">
        조회
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

//좌석 모달
function Seat({ id, type, reserved, onClick }) {
  const seatClass = reserved
    ? "seat reserved"
    : type === "outlet"
    ? "seat outlet"
    : "seat normal";

  return (
    <div className={seatClass} onClick={() => !reserved && onClick(id)}>
      {id}
    </div>
  );
}




export default App;
