import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import styled from "styled-components";
import "../css/Room.css";
import { FaMicrophone, FaVideo, FaComment, FaPhoneSlash } from "react-icons/fa";
import { MdScreenShare } from "react-icons/md";
import { VscRemoteExplorer } from "react-icons/vsc";

const Container = styled.div`
  padding: 20px;
  display: flex;
  height: 100vh;
  width: 90%;
  margin: auto;
  flex-wrap: wrap;
`;

const StyledVideo = styled.video`
  height: 40%;
  width: 50%;
`;

const Video = (props) => {
  const ref = useRef();

  useEffect(() => {
    props.peer.on("stream", (stream) => {
      ref.current.srcObject = stream;
    });
  }, []);

  return <StyledVideo playsInline autoPlay ref={ref} />;
};

const videoConstraints = {
  height: window.innerHeight / 2,
  width: window.innerWidth / 2,
};

const Room = (props) => {
  const [peers, setPeers] = useState([]);
  const [streams, setstream] = useState();
  const [enabledv, setenabledvideo] = useState(true);
  const [enableda, setenabledaudio] = useState(true);
  const socketRef = useRef();
  const userVideo = useRef();
  const peersRef = useRef([]);
  const roomID = props.match.params.roomID;

  useEffect(() => {
    socketRef.current = io.connect("/");
    navigator.mediaDevices
      .getUserMedia({ video: videoConstraints, audio: true })
      .then((stream) => {
        userVideo.current.srcObject = stream;
        setstream(stream);
        socketRef.current.emit("join room", roomID);
        socketRef.current.on("all users", (users) => {
          const peers = [];
          users.forEach((userID) => {
            const peer = createPeer(userID, socketRef.current.id, stream);
            peersRef.current.push({
              peerID: userID,
              peer,
            });
            peers.push(peer);
          });
          setPeers(peers);
        });

        socketRef.current.on("user joined", (payload) => {
          const peer = addPeer(payload.signal, payload.callerID, stream);
          peersRef.current.push({
            peerID: payload.callerID,
            peer,
          });

          setPeers((users) => [...users, peer]);
        });

        socketRef.current.on("receiving returned signal", (payload) => {
          const item = peersRef.current.find((p) => p.peerID === payload.id);
          item.peer.signal(payload.signal);
        });
      });
  }, []);

  function createPeer(userToSignal, callerID, stream) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socketRef.current.emit("sending signal", {
        userToSignal,
        callerID,
        signal,
      });
    });

    return peer;
  }

  function addPeer(incomingSignal, callerID, stream) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socketRef.current.emit("returning signal", { signal, callerID });
    });

    peer.signal(incomingSignal);

    return peer;
  }

  const audiotoogle = () => {
    streams.getTracks()[0].enabled = !enableda;
    setenabledaudio(!enableda);
  };

  const videotoogle = () => {
    streams.getTracks()[1].enabled = !enabledv;
    setenabledvideo(!enabledv);
  };

  const callend = () => {
    window.location.href = "https://vasd.vercel.app";
    streams.getTracks().stop();
  };

  const screenshare = () => {
    navigator.mediaDevices.getDisplayMedia({ cursor: true }).then((stream) => {
      const screenTrack = stream.getTracks()[0];
      peersRef.current.find((sender) => {
        sender.peer._senderMap.forEach((userID) => {
          userID.forEach((id) => {
            if (id.track.kind === "video") {
              id.replaceTrack(screenTrack);
            }
          });
        });
      });
      screenTrack.onended = function () {
        peersRef.current.find((sender) => {
          sender.peer._senderMap.forEach((userID) => {
            userID.forEach((id) => {
              if (id.track.kind === "video") {
                id.replaceTrack(streams.getTracks()[1]);
              }
            });
          });
        });
      };
    });
  };

  const chat = () => {
    window.location.href = "https://vasd.vercel.app/";
    streams.getTracks().stop();
  };

  const rcd = () => {
    window.location.href = "https://vasd.vercel.app/";
    streams.getTracks().stop();
  };

  return (
    <Container>
      <div className="top">
        <StyledVideo muted ref={userVideo} autoPlay playsInline />
        {peers.map((peer, index) => {
          return (
            <div key={index}>
              <Video controls peer={peer} />
              {console.log(index, peer)}
            </div>
          );
        })}
      </div>
      <div className="bottom">
        <button onClick={audiotoogle}>
          <FaMicrophone />
        </button>
        <button onClick={videotoogle}>
          <FaVideo />
        </button>
        <button onClick={screenshare}>
          <MdScreenShare />
        </button>
        <button onClick={chat}>
          <FaComment />
        </button>
        <button onClick={rcd}>
          <VscRemoteExplorer />
        </button>
        <button onClick={callend}>
          <FaPhoneSlash />
        </button>
      </div>
    </Container>
  );
};

export default Room;
