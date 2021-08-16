import React, { useState } from "react";
import { v1 as uuid } from "uuid";
import "../css/CreateRoom.css";

const CreateRoom = (props) => {

  function create() {
    const id = uuid();
    props.history.push(`/room/${id}`);
    copy("http://localhost:3000/room/"+id);
  }

  const copy = (value) => {
      console.log(value)
    navigator.clipboard.writeText(value)
  }
  

  return (
    <div className="container">
      <div className="join">
        <input type="text" placeholder="enter URL" />
        <button className="button1">Go</button>
      </div>
        <button className="btn" onClick={create}>
          Create room
        </button>
    </div>
  );
};

export default CreateRoom;
