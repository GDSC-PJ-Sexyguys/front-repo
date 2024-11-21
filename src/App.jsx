import React, { useState, useEffect } from "react";
import "./App.css"; // CSS 파일 import
import logo from "./logo.png";
import axios from "axios"; // Axios import

const axiosInstance = axios.create({
  baseURL: "/api", // 프록시 설정에 맞게 수정
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

//소강의실 예약

function SmallReservation() {
  const [modalInfo, setModalInfo] = useState({
    isOpen: false,
    title: "",
    roomIndex: null,
    reservedSeats: 0,
    totalSeats: 0,
  });

  const [rooms, setRooms] = useState([]); // 강의실 정보 상태
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reservationData, setReservationData] = useState([]); // 특정 강의실 예약 상태 check
  const [reservationViewOpen, setReservationViewOpen] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [reservedCount, setReservedCount] = useState(0);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const fetchRooms = async (setRooms, setLoading, setError) => {
    try {
      const response = await axiosInstance.get(
        "/small-room/reservations/search",
        {
          params: {
            buildingName: "60주년",
            roomName: "508호",
          },
        },
      );

      console.log("응답 데이터:", response.data);

      const currentTime = new Date().toISOString(); // 현재 시간 (ISO 포맷)

      // 응답 데이터를 필터링하여 현재 시간 범위에 있는 데이터를 선택
      let filteredRooms = response.data
        .filter((reservation) => {
          return (
            reservation.startTime <= currentTime &&
            reservation.endTime >= currentTime
          );
        })
        .map((reservation) => ({
          buildingName: reservation.buildingName,
          roomName: reservation.roomName,
          startTime: reservation.startTime,
          endTime: reservation.endTime,
          studentId: reservation.studentId,
          partySize: reservation.partySize,
        }));

      // 필터링 결과가 없는 경우 기본값 추가
      if (filteredRooms.length === 0) {
        filteredRooms = [
          {
            buildingName: "60주년",
            roomName: "508호",
            startTime: "0",
            endTime: "0",
            studentId: 0,
            partySize: 0,
          },
        ];
      }

      setRooms(filteredRooms);
      console.log("필터링된 강의실 데이터:", filteredRooms);
    } catch (error) {
      console.error("에러 발생:", error.message);
      if (error.response) {
        console.error("응답 데이터:", error.response.data);
        console.error("상태 코드:", error.response.status);
      }
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomReservations = async (buildingName, roomName) => {
    try {
      const response = await axiosInstance.get(
        "/small-room/reservations/daily-schedule",
        {
          params: { buildingName, roomName },
        },
      );
      setReservationData(response.data);
    } catch (error) {
      console.error("예약 데이터를 가져오지 못했습니다:", error);
    }
  };

  // 예약 요청 처리 함수
  const handleReservation = async () => {
    if (!studentId || !reservedCount || !startTime || !endTime) {
      alert("모든 정보를 입력해주세요.");
      return;
    }

    const room = rooms[modalInfo.roomIndex];

    // 30분 단위로 시간 조정
    const adjustToHalfHour = (time) => {
      const [hour, minute] = time.split(":").map(Number);

      let adjustedMinute;
      if (minute > 0 && minute <= 30) {
        adjustedMinute = "30"; // 1~30분은 30분으로 조정
      } else {
        adjustedMinute = "00"; // 31~59분 및 0분은 0으로 조정
      }

      const adjustedHour =
        adjustedMinute === "00" && minute > 30 ? (hour + 1) % 24 : hour;

      return `${String(adjustedHour).padStart(2, "0")}:${adjustedMinute}`;
    };

    const adjustedStartTime = adjustToHalfHour(startTime);
    const adjustedEndTime = adjustToHalfHour(endTime);

    // 예약 시간이 유효한지 확인
    if (adjustedStartTime >= adjustedEndTime) {
      alert("시작 시간이 종료 시간보다 빠를 수 없습니다.");
      return;
    }

    // 인원 초과 확인
    if (reservedCount > modalInfo.totalSeats) {
      alert("예약 인원이 강의실 수용 인원을 초과합니다.");
      return;
    }

    // 예약 충돌 확인
    const todayDate = new Date().toISOString().split("T")[0];
    const startDateTime = new Date(
      `${todayDate}T${adjustedStartTime}:00`,
    ).toISOString();
    const endDateTime = new Date(
      `${todayDate}T${adjustedEndTime}:00`,
    ).toISOString();

    const hasConflict = reservationData.some((reservation) => {
      return (
        (startDateTime >= reservation.startTime &&
          startDateTime < reservation.endTime) ||
        (endDateTime > reservation.startTime &&
          endDateTime <= reservation.endTime) ||
        (startDateTime <= reservation.startTime &&
          endDateTime >= reservation.endTime)
      );
    });

    if (hasConflict) {
      alert("이미 예약된 시간이 포함되어 있습니다.");
      return;
    }

    // 서버에 예약 요청
    try {
      const response = await axiosInstance.post("/small-room/reservations", {
        bookerStudentId: parseInt(studentId, 10),
        buildingName: "60주년",
        roomName: room.roomName,
        startTime: startDateTime,
        endTime: endDateTime,
        partySize: reservedCount,
      });

      alert(`예약이 완료되었습니다! 예약 ID: ${response.data}`);
      closeModal();
      fetchRooms(); // 예약 완료 후 강의실 정보 다시 가져오기
    } catch (error) {
      console.error("예약 요청 중 오류 발생:", error);
      if (error.response) {
        alert(error.response.data.message || "예약에 실패했습니다.");
      }
    }
  };

  // 모달 열기
  const openModal = (roomIndex, roomName, reservedSeats, totalSeats) => {
    setModalInfo({
      isOpen: true,
      title: roomName,
      roomIndex,
      reservedSeats,
      totalSeats,
    });
    fetchRoomReservations("60주년", roomName);
  };

  // 모달 닫기
  const closeModal = () => {
    setModalInfo({
      isOpen: false,
      title: "",
      roomIndex: null,
      reservedSeats: 0,
      totalSeats: 4,
    });
    setStudentId("");
    setReservedCount(0);
    setStartTime("");
    setEndTime("");
  };

  // 예약 정보 확인 모달 열기
  const openReservationView = () => setReservationViewOpen(true);

  // 예약 정보 확인 모달 닫기
  const closeReservationView = () => setReservationViewOpen(false);

  // 시간 예약 상태 확인
  const isTimeReserved = (time) => {
    const today = new Date().toISOString().split("T")[0]; // 오늘 날짜
    return reservationData.some(
      (reservation) =>
        reservation.startTime.startsWith(today) &&
        reservation.startTime <= `${today}T${time}:00` &&
        reservation.endTime > `${today}T${time}:00`,
    );
  };

  // 예약 시간 슬롯 생성
  const generateTimeSlots = () => {
    const timeSlots = [];
    for (let hour = 0; hour < 24; hour++) {
      timeSlots.push({
        time: `${String(hour).padStart(2, "0")}:00`,
        isHourStart: true,
      });
      timeSlots.push({
        time: `${String(hour).padStart(2, "0")}:30`,
        isHourStart: false,
      });
    }
    return timeSlots;
  };

  // 초기 데이터 로드
  useEffect(() => {
    fetchRooms(setRooms, setLoading, setError);
  }, []);
  //30분단위로 시간을 맞춰줌.
  const adjustToHalfHour = (time) => {
    const [hour, minute] = time.split(":").map(Number);
    const adjustedMinute = minute < 30 ? "30" : "00";
    const adjustedHour = minute < 30 ? hour : (hour + 1) % 24;
    return `${String(adjustedHour).padStart(2, "0")}:${adjustedMinute}`;
  };
  return (
    <div className="reservations-container">
      {rooms.map((room, index) => (
        <ReservationCircle
          key={index}
          roomName={`60주년-${room.roomName}`}
          totalSeats={4}
          reservedSeats={room.partySize}
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
                />
              </label>
              <label>
                시작 시간:
                <input
                  type="time"
                  value={startTime}
                  step="1800" // 30분 단위 (30분 = 1800초)
                  onChange={(e) =>
                    setStartTime(adjustToHalfHour(e.target.value))
                  }
                />
              </label>
              <label>
                끝 시간:
                <input
                  type="time"
                  value={endTime}
                  step="1800" // 30분 단위
                  onChange={(e) => setEndTime(adjustToHalfHour(e.target.value))}
                />
              </label>
              <button onClick={handleReservation}>예약</button>
              <button onClick={openReservationView}>예약 정보 확인</button>
            </div>
          }
        />
      )}
      {reservationViewOpen && (
        <div className="reservation-check-modal">
          <div className="reservation-check-content">
            <h2>오늘의 예약 정보</h2>
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
