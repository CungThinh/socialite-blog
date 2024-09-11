let socket = null;
let currentUser;

document.addEventListener("DOMContentLoaded", function () {
  const userDiv = document.getElementById("user-info");
  if (userDiv) {
    currentUser = userDiv.dataset.user;
    console.log("Current user:", currentUser);
  } else {
    console.error("Element with ID 'user-info' not found.");
  }
});

function connectToRoom(roomId) {
  if (socket !== null) {
    socket.close();
  }
  const websocketProtocol =
    window.location.protocol === "https:" ? "wss" : "ws";
  const wsEndpoint = `${websocketProtocol}://${window.location.host}/ws/notification/${roomId}`;
  socket = new WebSocket(wsEndpoint);

  socket.onopen = (event) => {
    console.log("WebSocket connection opened!");
  };

  socket.onerror = (event) => {
    console.error("WebSocket error:", event);
  };

  socket.onclose = (event) => {
    console.log("WebSocket connection closed with code:", event.code);
  };

  const currentRoom = document.querySelector(`.chat_list[data-room-id="${roomId}"]`);
  currentRoom.classList.add("active_chat");

  const sendButton = document.querySelector(".msg_send_btn");
  sendButton.addEventListener("click", function () {
    const messageInput = document.querySelector(".write_msg"); // Lấy đối tượng input tin nhắn
    const message = messageInput.value.trim();
    handleFormSubmit(roomId, message);
    messageInput.value = "";
  });

  const roomElements = document.querySelectorAll(".clickable-room");
  roomElements.forEach(function (room) {
    room.addEventListener("click", function () {
      const roomId = this.getAttribute("data-room-id");
      const activeRooms = document.querySelectorAll(".chat_list.active_chat");
      activeRooms.forEach(function (activeRoom) {
        activeRoom.classList.remove("active_chat");
      });
      this.closest(".chat_list").classList.add("active_chat");
      switchRoom(roomId);
    })
  });

  socket.addEventListener("message", (event) => {
    try {
      const messageData = JSON.parse(event.data)["message"];
      const sender = messageData["sender"];
      const message = messageData["message"];
      const img_url = messageData["img_url"];
      const messagesDiv = document.querySelector(".msg_history");
      if (sender !== currentUser) {
        // Hiển thị tin nhắn nhận được cùng với hình ảnh đại diện của người gửi
        messagesDiv.innerHTML += `<div class="incoming_msg">
                                      <div class="incoming_msg_img">
                                        <img src= ${img_url} alt="" />
                                      </div>
                                      <div class="received_msg">
                                        <div class="received_withd_msg">
                                          <p>${message}</p>
                                          <div class="time_date">unknown</div>
                                        </div>
                                      </div>
                                  </div>`;
      } else {
        // Hiển thị tin nhắn đã gửi cùng với hình ảnh đại diện của người gửi
        messagesDiv.innerHTML += `<div class= "outgoing_msg">
                                      <div class= "sent_msg">
                                        <p>${message}</p>
                                        <div class="time_date">unknown</div>
                                      </div>
                                  </div>`;
      }
      scrollToBottom();
    } catch (error) {
      console.error("Error parsing message:", error);
    }
  });
};

function loadMessages(roomId) {
  $.ajax({
    url: "/chat/" + parseInt(roomId) + "/messages",
    success: function (data) {
      const messagesDiv = document.querySelector(".msg_history");
      messagesDiv.innerHTML = ""; // Xóa hết các tin nhắn hiện có trước khi hiển thị tin nhắn mới
      data.messages.forEach(function (message) {
        var messageHTML = '';
        if (message.sender === currentUser) {
          messageHTML = `
          <div class="${message.sender === currentUser ? "outgoing_msg" : "incoming_msg"}">
            <div class="${message.sender === currentUser ? "sent_msg" : "received_msg"}">
                <p>${message.message}</p>
                <div class="time_date">${message.timestamp}</div>
            </div>
          </div>
        `;
        }
        else {
          messageHTML = `
          <div class="${message.sender === currentUser ? "outgoing_msg" : "incoming_msg"}">
            <div class="incoming_msg_img">
              <img src= ${message.sender_img_url} alt="" />
            </div>
            <div class="${message.sender === currentUser ? "sent_msg" : "received_msg"}">
              <div class="received_withd_msg">
                <p>${message.message}</p>
                <div class="time_date">${message.timestamp}</div>
              </div>
            </div>
          </div>
        `;
        }
        messagesDiv.innerHTML += messageHTML;
      });
      scrollToBottom();
    },
    error: function (xhr, status, error) {
      console.error("Error loading messages:", error);
    }
  });
}

function switchRoom(roomId) {
  const sendButton = document.querySelector(".msg_send_btn");
  const roomElements = document.querySelectorAll(".chat_list");
  removeAllListeners(sendButton);
  roomElements.forEach(function (room) {
    removeAllListeners(room);
  });

  connectToRoom(roomId);
  loadMessages(roomId);
}

function handleFormSubmit(roomId, message) {
  let isSubmitting = false
  if (socket.readyState !== WebSocket.OPEN) {
    console.error("WebSocket is not ready yet.");
    return;
  }

  if (isSubmitting) {
    return;
  }

  isSubmitting = true;
  try {
    socket.send(
      JSON.stringify({
        message: message,
        room_id: roomId,
        sender: currentUser,
      })
    );
    isSubmitting = false;
  } catch (error) {
    console.error("Error sending message:", error);
    isSubmitting = false;
  }
}

function removeAllListeners(element) {
  const clonedElement = element.cloneNode(true);
  element.parentNode.replaceChild(clonedElement, element);
}

function scrollToBottom() {
  var messageContainer = $('.msg_history');
  messageContainer.scrollTop(messageContainer.prop("scrollHeight"));
}

$(document).ready(function () {
  $('#username-input').on('input', function () {
      const query = $(this).val().trim();

      if (query) {
          $.ajax({
              url: '/search/',
              data: {
                  'q': query,
              },
              dataType: 'json',
              success: function (data) {
                  const resultsUl = $('#message-user-search-results');
                  resultsUl.empty().removeClass('d-none');

                  for (const user of data.users) {
                      const listItem = $('<li></li>').addClass('list-group-item list-group-item-action');

                      const link = $('<a></a>').attr('href', 'javascript:void(0);').attr('data-username', user.username);
                      listItem.append(link);

                      if (user.profile_image) {
                          const profileImage = $('<img>').attr('src', user.profile_image);
                          profileImage.attr('alt', 'Profile Image');
                          profileImage.addClass('list-avatar');
                          link.append(profileImage);
                      }

                      const nameDiv = $('<div></div>').addClass('list-name d-inline-block align-middle').text(user.full_name);
                      link.append(nameDiv);

                      resultsUl.append(listItem);
                  }
              },
              error: function () {
                  console.log('Error occurred during the AJAX request.');
              }
          });
      } else {
          $('#message-user-search-results').empty().addClass('d-none');
      }
  });

  // Bắt sự kiện khi nhấp vào một kết quả tìm kiếm
  $('#message-user-search-results').on('click', 'li', function () {
      const username = $(this).find('a').data('username');
      startChat(username);
  });
});

function startChat(username) {
  $.ajax({
    url: '/chat/create-room/' + username,
    success: function(data) {
      if (data.room_id) {
        const activeRooms = document.querySelectorAll(".chat_list.active_chat");
        activeRooms.forEach(function(activeRoom) {
          activeRoom.classList.remove("active_chat");
        });
        switchRoom(data.room_id);
        loadMessages(data.room_id);
        UIkit.modal('#user-modal').hide();
      }
    },
    error: function(xhr, status, error) {
      console.log("Error creating or getting room", error);
    }
  });
}