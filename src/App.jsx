import React, { useState, useEffect } from "react";
import "./App.css"; // CSS 파일 import
import logo from "./logo.png";
import axios from "axios"; // Axios import

const axiosInstance = axios.create({
  baseURL: "http://13.125.239.73:8080/", // API의 기본 URL
  headers: {
    "Content-Type": "application/json",
  },
});

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

//대강의실
function BigReservation() {
  const [rooms, setRooms] = useState([]);
  const [modalInfo, setModalInfo] = useState({
    isOpen: false,
    title: "",
    seats: [],
  });
  const [studentIdModal, setStudentIdModal] = useState({
    isOpen: false,
    seatId: null,
    roomIndex: null,
  });

  // 각 방의 좌석 데이터를 동적으로 생성
  const buildingInfo = [
    { buildingName: "하", roomName: "120", totalSeats: 60 },
    { buildingName: "5", roomName: "남140", totalSeats: 40 },
    { buildingName: "하", roomName: "224", totalSeats: 60 },
  ];

  useEffect(() => {
    const fetchOccupiedSeats = async () => {
      try {
        const responses = await Promise.all(
          buildingInfo.map((building) =>
            axios.get(
              "http://13.125.239.73:8080/api/large-room/tickets/search",
              {
                params: {
                  buildingName: building.buildingName, // 빌딩 이름
                  roomName: building.roomName, // 방 이름
                },
              },
            ),
          ),
        );

        // 점유된 좌석 수를 각 빌딩 데이터와 결합
        const updatedRooms = buildingInfo.map((building, index) => ({
          ...building,
          reservedSeats: responses[index].data.occupiedSeats, // 서버에서 받은 점유 좌석 수
        }));

        setRooms(updatedRooms);
      } catch (error) {
        console.error("Error fetching occupied seats:", error);
        //alert("점유된 좌석 수를 가져오는 데 실패했습니다.");
      }
    };

    fetchOccupiedSeats();
  }, []);

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

  const openTimeModal = async (seatId) => {
    try {
      // 서버에서 남은 시간 가져오기
      const response = await axios.get(`/api/seats/${seatId}`);
      setTimeModal({
        isOpen: true,
        seatId,
        remainingTime: response.data.remainingTime, // 서버에서 받은 남은 시간
      });
    } catch (error) {
      console.error("Error fetching remaining time:", error);
      alert("남은 시간을 가져오는 데 실패했습니다.");
    }
  };

  const closeTimeModal = () => {
    setTimeModal({
      isOpen: false,
      seatId: null,
      remainingTime: null,
    });
  };

  // 좌석 예약 함수 추가
  const reserveSeat = async (studentId, buildingName, roomName, seatNumber) => {
    try {
      const response = await axiosInstance.post(
        "http://13.125.239.73:8080/large-room/tickets",
        {
          bookerStudentId: studentId,
          buildingName,
          roomName,
          seatNumber,
        },
      );
      alert(`좌석이 성공적으로 예약되었습니다! 티켓 ID: ${response.data}`);
    } catch (error) {
      if (error.response && error.response.data) {
        alert(`예약 실패: ${error.response.data.message}`);
      } else {
        alert("예약 중 오류가 발생했습니다.");
      }
    }
  };

  const handleReservation = (studentId) => {
    const { roomIndex, seatId } = studentIdModal;
    const room = rooms[roomIndex];
    const seat = room.seats.find((s) => s.id === seatId);

    if (seat && !seat.reserved) {
      reserveSeat(studentId, "하120", modalInfo.title, seatId);
      closeStudentIdModal();
      closeModal();
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
              onSeatClick={(seat) => {
                const roomIndex = rooms.findIndex(
                  (room) => room.roomName === modalInfo.title,
                );
                if (seat.reserved) {
                  openTimeModal(seat.id); // 예약된 좌석이면 시간 모달 열기
                } else {
                  openStudentIdModal(roomIndex, seat.id); // 예약되지 않은 좌석이면 학번 모달 열기
                }
              }}
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
    roomIndex: null,
    reservedSeats: 0,
    totalSeats: 0,
  });

  // 입력 필드 상태
  const [reservationViewOpen, setReservationViewOpen] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [reservedCount, setReservedCount] = useState(0); // 예약할 사람 수
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // 모달 열기
  const openModal = (roomIndex, roomName, reservedSeats, totalSeats) => {
    setModalInfo({
      isOpen: true,
      title: roomName,
      roomIndex,
      reservedSeats,
      totalSeats,
    });
    document.body.style.overflow = "hidden";
  };

  // 모달 닫기
  const closeModal = () => {
    setModalInfo({
      isOpen: false,
      title: "",
      roomIndex: null,
      reservedSeats: 0,
      totalSeats: 0,
    });
    document.body.style.overflow = "auto";
    setStudentId(""); // 학번 초기화
    setReservedCount(0); // 예약할 사람 수 초기화
    setStartTime(""); // 시작시간 초기화
    setEndTime(""); // 끝시간 초기화
  };

  // 30분 단위 시간으로 변경하는 함수
  const adjustToHalfHour = (time) => {
    const [hours, minutes] = time.split(":").map(Number);
    const adjustedMinutes = Math.floor(minutes / 30) * 30; // 30분 단위로 조정
    return `${String(hours).padStart(2, "0")}:${String(adjustedMinutes).padStart(2, "0")}`;
  };

  // 시작 시간 설정
  const handleStartTimeChange = (e) => {
    const time = e.target.value;
    setStartTime(adjustToHalfHour(time));
  };

  // 끝 시간 설정
  const handleEndTimeChange = (e) => {
    const time = e.target.value;
    setEndTime(adjustToHalfHour(time));
  };

  // 예약 처리
  const handleReservation = () => {
    if (!studentId || !reservedCount || !startTime || !endTime) {
      alert("모든 정보를 입력해주세요.");
      return;
    }

    const updatedRooms = [...rooms];
    const room = updatedRooms[modalInfo.roomIndex];

    // 예약할 사람 수가 가용 좌석 수를 초과하지 않도록 확인
    if (reservedCount > room.totalSeats - room.reservedSeats) {
      alert("예약할 수 있는 좌석 수를 초과하였습니다.");
      return;
    }

    // 예약 처리
    room.reservedSeats += reservedCount;
    setModalInfo({
      ...modalInfo,
      reservedSeats: room.reservedSeats,
    });
    alert(
      `예약이 완료되었습니다! 학번: ${studentId}, 예약 인원: ${reservedCount}, 시작시간: ${startTime}, 끝시간: ${endTime}`,
    );
    closeModal();
  };
  //예약 정보 확인

  const openReservationView = () => {
    setReservationViewOpen(true);
  };

  // 예약 정보 확인 모달 닫기
  const closeReservationView = () => {
    setReservationViewOpen(false);
  };

  const reservationData = [
    { start: "09:00", end: "12:30" }, // 예약 구간
    { start: "14:00", end: "15:30" },
    { start: "18:00", end: "20:00" },
  ];

  const generateTimeSlots = () => {
    const timeSlots = [];
    for (let hour = 0; hour < 24; hour++) {
      timeSlots.push({
        time: `${String(hour).padStart(2, "0")}:00`,
        isHourStart: true, // 시간의 시작인지 여부
      });
      timeSlots.push({
        time: `${String(hour).padStart(2, "0")}:30`,
        isHourStart: false,
      });
    }
    return timeSlots;
  };

  // 특정 시간대가 예약되었는지 확인
  const isTimeReserved = (time) => {
    for (const reservation of reservationData) {
      if (time >= reservation.start && time < reservation.end) {
        return true; // 예약됨
      }
    }
    return false; // 사용 가능
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
            openModal(index, room.roomName, room.reservedSeats, room.totalSeats)
          }
        />
      ))}
      {modalInfo.isOpen && (
        <Modal
          title={modalInfo.title}
          onClose={closeModal}
          content={
            <div className="reservation-form">
              <label>
                학번:
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="학번을 입력하세요"
                />
              </label>
              <label>
                예약할 사람 수:
                <input
                  type="number"
                  value={reservedCount}
                  onChange={(e) => setReservedCount(Number(e.target.value))}
                  min="1"
                  max={modalInfo.totalSeats - modalInfo.reservedSeats}
                  placeholder="예약할 인원 수"
                />
              </label>
              <label>
                시작 시간:
                <input
                  type="time"
                  value={startTime}
                  onChange={handleStartTimeChange}
                  required
                />
              </label>
              <label>
                끝 시간:
                <input
                  type="time"
                  value={endTime}
                  onChange={handleEndTimeChange}
                  required
                />
              </label>
              <button onClick={handleReservation}>예약</button>
              <button onClick={openReservationView}>예약 정보 확인</button>
            </div>
          }
        />
      )}
      {/*예약정보 확인 모달 띄우기*/}
      {reservationViewOpen && (
        <div className="reservation-check-modal">
          <div className="reservation-check-content">
            <h2>예약 정보</h2>
            <div className="reservation-bar">
              {generateTimeSlots().map((slot, index) => (
                <div
                  key={index}
                  className={`time-slot ${
                    isTimeReserved(slot.time) ? "reserved" : "available"
                  }`}
                >
                  {slot.isHourStart && (
                    <span className="time-label">
                      {slot.time.split(":")[0]}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <button onClick={closeReservationView}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}

// 좌석 데이터를 예약 시간 추가
function createRoom(roomName, totalSeats, reservedSeats) {
  const seats = Array.from({ length: totalSeats }, (_, index) => ({
    id: index + 1,
    type: Math.random() < 0.3 ? "outlet" : "normal",
    reserved: index < reservedSeats,
    reservedUntil: index < reservedSeats ? getReservationEndTime() : null, // 예약 종료 시간
  }));
  return { roomName, totalSeats, reservedSeats, seats };
}

// 예약 종료 시간을 랜덤으로 설정하는 함수 (예시)
function getReservationEndTime() {
  const now = new Date();
  const endTime = new Date(now.getTime() + Math.random() * 60 * 60 * 1000); // 1시간 이내로 랜덤 설정
  return endTime;
}

// 예약된 좌석에 대해 남은 시간을 계산하는 함수
function calculateTimeLeft(reservedUntil) {
  if (!reservedUntil) return 0; // 예약 종료 시간이 없으면 0으로 처리
  const now = new Date();
  const timeLeft = reservedUntil - now;
  return timeLeft > 0 ? timeLeft : 0; // 남은 시간이 0 미만일 경우 0으로 설정
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
          onClick={() => onSeatClick(seat)} // seat 객체 전달
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
