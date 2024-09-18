//Event Delegation

document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('.posts-section').addEventListener('click', function (event) {
        const target = event.target;

        // Kiểm tra xem target có là nút like không
        if(target.classList.contains('post-rating-button') && target.classList.contains('material-icons')) {
            const postId = target.getAttribute('post-id');
            if(postId) {
                handleLikePost(postId, target);
            }
        }

        // Xử lý nút comment
        if (target.classList.contains('post-rating-button') && target.classList.contains('comment')) {
            const article = target.closest('article');
            if (article) {
                toggleCommentsSection(article);
            }
        }

        if (target.classList.contains('submit-comment')) {
            var button = event.target;
            const postId = target.getAttribute('data-post-id');
            var content = document.querySelector(`#comment-input-${postId}`).value;
            var replyToCommentId = button.closest('.comments-input').getAttribute("data-reply-to-comment-id");

            if (replyToCommentId) {
                submitReplyComment(replyToCommentId, content, postId)
            }else {
                submitNewComment(postId, content)
            }
        }

        if(target.classList.contains('fa-reply')) {
            const commentBox = target.closest('.comment-box');
            const commentAuthor = commentBox.querySelector('.comment-name a').innerText;
            const commentsInputContainer = target.closest('article').querySelector('.comments-input');
            const commentId = commentBox.getAttribute('data-comment-id');
            const replyToCommentText = document.getElementById('reply-to-comment');
            const replyToComment = document.querySelector('.comments-reply');

            commentsInputContainer.setAttribute('data-reply-to-comment-id', commentId);
            replyToCommentText.innerText = 'Replying to ' + commentAuthor;
            replyToComment.style.display = 'flex';
        }

        if (target.classList.contains('cancel-reply')) {
            const replyToCommentContainer = target.closest('.comments-reply');
            const commentsInputContainer = target.closest('article').querySelector('.comments-input');
        
            // Ẩn phần "Replying to..." và xóa thông tin người được reply
            replyToCommentContainer.style.display = 'none';
            commentsInputContainer.setAttribute('data-reply-to-comment-id', '');
            document.getElementById('reply-to-comment').innerText = '';  // Xóa nội dung "Replying to..."
        }
    });
});

function submitReplyComment(replyToCommentId, content, postId) {
    fetch(`/post/reply-comment/${replyToCommentId}`, {
        method: "POST",
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: "content=" + encodeURIComponent(content)
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                var commentBox = document.querySelector(`[data-comment-id="${replyToCommentId}"]`);
                var replyList = commentBox.closest('li').querySelector('.reply-list');
                if (!replyList) {
                    // Nếu chưa có danh sách reply, tạo mới và thêm vào sau comment-main-level
                    replyList = document.createElement('ul');
                    replyList.classList.add('comments-list', 'reply-list');
                    commentBox.closest('li').appendChild(replyList);
                }

                // Khi bấm nút send, kiểm tra xem <li></li> của commentbox có chứa
                // reply-list hay không, nếu có thì append phẩn tử newReply vào
                // Nếu ko thì tạo một cấu trúc replyList, add phần tử newRelpy vào
                // Sau đó thêm vào replyList 

                var newReply = `
                            <li>
                                <div class="comment-avatar"><img src="${data.avatar}" alt=""></div>
                                <div class="comment-box">
                                    <div class="comment-head">
                                        <h6 class="comment-name"><a href="#">${data.author}</a></h6>
                                        <span>${data.date_posted}</span>
                                        <i class="fa fa-heart"></i>
                                    </div>
                                    <div class="comment-content">
                                        ${data.content}
                                    </div>
                                </div>
                            </li>
                        `;

                replyList.insertAdjacentHTML('beforeend', newReply);

                document.querySelector(`#comment-input-${postId}`).value = '';
                document.querySelector('.comments-input').setAttribute('data-reply-to-comment-id', '');
                document.getElementById('reply-to-comment').style.display = 'none';
            } else {
                alert(data.message)
            }
        })
        .catch(error => console.error('Error:', error));
}

function submitNewComment(postId, content) {
    fetch(`/post/add-comment/${postId}/`, {
        method: "POST",
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: "content=" + encodeURIComponent(content)
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                var commentList = document.querySelector(`#comments-list-${postId}`);

                // Xóa thông báo "Chưa có bình luận nào" nếu có
                var emptyComment = commentList.querySelector('.comment-empty');
                if (emptyComment) {
                    emptyComment.remove();
                }

                // Tạo phần tử bình luận mới
                var newComment = `
                    <li>
                        <div class="comment-main-level">
                            <div class="rounded-circle comment-avatar"><img src="${data.avatar}" alt=""></div>
                            <div class="comment-box">
                                <div class="comment-head">
                                    <h6 class="comment-name"><a href="#">${data.author}</a></h6>
                                    <span>${data.date_posted}</span>
                                    <i class="fa fa-reply"></i>
                                    <i class="fa fa-heart"></i>
                                </div>
                                <div class="comment-content">
                                    ${data.content}
                                </div>
                            </div>
                        </div>
                    </li>`;

                // Thêm bình luận mới vào danh sách bình luận
                commentList.insertAdjacentHTML('beforeend', newComment);
                document.querySelector(`#comment-input-${postId}`).value = '';  // Xóa nội dung input
            } else {
                alert(data.message);
            }
        })
        .catch(error => console.error('Error:', error));
}

function handleLikePost(postId, target) {
    fetch(`/like-post/${postId}/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => {
        if (response.status === 302) {
            window.location.href = '/login/';
            return;
        }
        return response.json();
    })
    .then(data => {
        const likeCountSpan = document.getElementById(`like-count-${postId}`);
        likeCountSpan.innerText = data.likes_count;

        if (data.liked) {
            target.setAttribute('status', 'true');
            target.classList.add('liked');
        } else {
            target.setAttribute('status', 'false');
            target.classList.remove('liked');
        }
    })
    .catch(error => console.error('Error:', error));
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function toggleCommentsSection(article) {
    const commentsContainer = article.querySelector('.comments-container');
    const commentInput = article.querySelector('.comments-input');
    if (commentsContainer.style.display === 'none' || commentsContainer.style.display === '') {
        commentsContainer.style.display = 'block';
        commentInput.style.display = 'flex';
    } else {
        commentsContainer.style.display = 'none';
        commentInput.style.display = 'none';
    }
}


// Lazy load

document.addEventListener('DOMContentLoaded', () => {
    let page = 2;
    let isLoading = false;
    const postContainer = document.querySelector('.posts-section');
    const loadingIndicator = document.getElementById('loading');

    window.addEventListener('scroll', () => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300 && !isLoading) {
            loadMorePosts();
        }
    });

    function loadMorePosts() {
        if (isLoading) return;

        isLoading = true;
        loadingIndicator.style.display = 'block';

        fetch(`/load-more-posts/?page=${page}`)
            .then(response => response.json())
            .then(data => {
                loadingIndicator.style.display = 'none';
                if (data.posts.length > 0) {
                    data.posts.forEach(post => {
                        const article = document.createElement('article');
                        article.classList.add('media', 'content-section', 'd-flex', 'flex-column');
                        article.innerHTML = `
                                <div class="d-flex">
                                    <img class="rounded-circle article-img" src="${post.author_image}" alt="">
                                    <div class="media-body">
                                        <div class="article-metadata">
                                            <a class="mr-2" href="/user-posts/${post.author}">${post.author}</a>
                                            <small class="text-muted">${post.date_posted}</small>
                                        </div>
                                        <h2 style="margin-top: auto;"><a class="article-title" href="/post-detail/${post.id}">${post.title}</a></h2>
                                        <p class="article-content">${post.content}...</p>
                                        <div class="post-rating">
                                            <span class="post-rating-button material-icons" post-id="${post.id}">thumb_up</span>
                                            <span class="like-count" id="like-count-${post.id}">${post.like_count}</span>
                                            <span class="post-rating-button material-icons comment">comment</span>
                                            <span class="comment-count">${post.comment_count}</span>
                                            <span class="post-rating-button material-icons">share</span>
                                        </div>
                                    </div>
                                </div>
                                <!-- Container cho comments -->
                                <div class="comments-container" id="comments-container-${post.id}" style="display: none;">
                                    <ul id="comments-list-${post.id}" class="comments-list">
                                        <!-- Comments sẽ được load tại đây -->
                                    </ul>
                                </div>
                                <!-- Input cho comment -->
                                <div class="comments-reply" style="display: none;">
                                    <span id="reply-to-comment"></span>
                                    <i class="fa fa-x cancel-reply"></i>
                                </div>
                                <div class="comments-input" data-reply-to-comment-id="">
                                    <input type="text" id="comment-input-${post.id}" placeholder="Enter your comment" class="form-control">
                                    <button class="btn btn-primary mt-1 submit-comment" data-post-id="${post.id}">Send</button>
                                </div>`;

                        postContainer.appendChild(article);
                        loadComments(post.id)
                    });
                    page++;
                    isLoading = false;
                } else {
                    loadingIndicator.innerText = 'No more posts to load';
                }
            })
            .catch(err => {
                console.error('Error loading more posts:', err);
                isLoading = false;
            });
    }
});

function loadComments(postId) {
    const commentsList = document.getElementById(`comments-list-${postId}`);

    fetch(`/load-comments/${postId}/`)
        .then(response => response.json())
        .then(data => {
            // Clear the current comments list (nếu cần reset trước khi load lại)
            commentsList.innerHTML = '';

            if (data.comments.length === 0) {
                // Hiển thị thông báo nếu không có bình luận nào
                const emptyCommentElement = document.createElement('li');
                emptyCommentElement.classList.add('comment-empty');
                emptyCommentElement.innerHTML = `<p>Chưa có bình luận nào.</p>`;
                commentsList.appendChild(emptyCommentElement);
            } else {
                // Nếu có bình luận, hiển thị danh sách bình luận
                data.comments.forEach(comment => {
                    const commentElement = document.createElement('li');
                    commentElement.innerHTML = `
                            <div class="comment-main-level" comment-id="${comment.id}">
                                <div class="rounded-circle comment-avatar">
                                    <img src="${comment.profile_image_url}" alt="">
                                </div>
                                <div class="comment-box" data-comment-id="${comment.id}">
                                    <div class="comment-head">
                                        <h6 class="comment-name"><a href="/user-posts/${comment.author}">${comment.author}</a></h6>
                                        <span>${comment.date_posted}</span>
                                        <i class="fa fa-reply"></i>
                                        <i class="fa fa-heart"></i>
                                    </div>
                                    <div class="comment-content">${comment.content}</div>
                                </div>
                            </div>
                            <ul class="comments-list reply-list">
                                ${comment.replies.map(reply => `
                                    <li>
                                        <div class="comment-avatar"><img src="${reply.profile_image_url}" alt=""></div>
                                        <div class="comment-box">
                                            <div class="comment-head">
                                                <h6 class="comment-name"><a href="/user-posts/${reply.author}">${reply.author}</a></h6>
                                                <span>${reply.date_posted}</span>
                                                <i class="fa fa-heart"></i>
                                            </div>
                                            <div class="comment-content">${reply.content}</div>
                                        </div>
                                    </li>
                                `).join('')}
                            </ul>
                        `;
                    commentsList.appendChild(commentElement);
                });
            }
        })
        .catch(error => console.error('Error loading comments:', error));
}


$(document).on("click", "#add-friend", function () {
    let id = $(this).attr("data-friend-id");
    let $this = $(this); // Lưu trữ tham chiếu đến phần tử đang click
    console.log(id);

    $.ajax({
        url: "/add-friend/",
        dataType: "json",
        data: {
            "id": id
        },
        success: function (response) {
            console.log("Bool ==", response.bool);
            if (response.bool == true) {
                // Khi thêm bạn thành công, chuyển sang trạng thái "Cancel Request"
                $this.html("<i class='fas fa-user-minus'></i> Cancel Request");
                $this.addClass("btn-danger");
                $this.removeClass("btn-primary");
            } else if (response.bool == false) {
                // Khi hủy yêu cầu, chuyển về trạng thái "Add Friend"
                $this.html("<i class='fas fa-user-plus'></i> Add Friend");
                $this.addClass("btn-primary");
                $this.removeClass("btn-danger");
            }
        }
    });
});

$(document).on("click", "#accept-friend-request", function () {
    let id = $(this).attr("data-request-id");
    console.log(id);

    $.ajax({
        url: "/accept-friend-request/",
        dataType: "json",
        data: {
            "id": id
        },
        success: function (response) {
            console.log(response.data);
            // Ẩn nút reject
            $(".reject-friend-request-hide" + id).hide()
            // Thay đổi nội dung nút accept
            $(".accept-friend-request" + id).html("<i class='fas fa-check-circle'></i> Friend Request Accepted");
            $(".accept-friend-request" + id).addClass("text-white");
        }
    });
});

$(document).on("click", "#reject-friend-request", function () {
    let id = $(this).attr("data-request-id")
    console.log(id);

    $.ajax({
        url: "/reject-friend-request/",
        dataType: "json",
        data: {
            "id": id
        },
        success: function (response) {
            console.log(response.data);
            $(".accept-friend-request-hide" + id).hide()
            $(".reject-friend-request" + id).html("<i class='fas fa-check-circle'></i> Friend Request Rejected")
            $(".reject-friend-request" + id).addClass("text-white")
        }
    })
})

// UnFriend User
$(document).on("click", "#unfriend", function () {
    let id = $(this).attr("data-friend-id")
    console.log(id);

    $.ajax({
        url: "/unfriend/",
        dataType: "json",
        data: {
            "id": id
        },
        success: function (response) {
            console.log(response);
            $("#unfriend-text").html("<i class='fas fa-check-circle'></i> Friend Removed ")
            $(".unfriend" + id).addClass("bg-blue-600")
            $(".unfriend" + id).removeClass("bg-red-600")
        }
    })
})

// $(document).ready(function() {
//     function updateFriendStatus() {
//         $.ajax({
//             url: '/check_friends_status/', 
//             method: 'GET',
//             success: function(response) {
//                 if (response.friends.length > 0) {
//                     response.friends.forEach(function(friend) {
//                         if (friend.is_online) {
//                             $('#friend-avatar-' + friend.id).addClass('status_online');
//                         } else {
//                             $('#friend-avatar-' + friend.id).removeClass('status_online');
//                         }
//                     });
//                     // setInterval(updateFriendStatus, 5000);
//                 }
//             }
//         });
//     }

//     // Gọi hàm ngay lập tức khi trang được tải
//     updateFriendStatus();
// });



// const notificationSocket = new WebSocket(
//     'ws://' + window.location.host + '/ws/notifications/'
// );

// notificationSocket.onmessage = function(e) {
//     const data = JSON.parse(e.data);
//     const notification = data.notification;

//     if (notification.notification_type === 'like') {
//         console.log(`${notification.sender.username} liked your post: ${notification.post.title}`);
//     }
//     // Thêm các điều kiện khác cho các loại thông báo khác
// };

const websocketProtocol =
    window.location.protocol === "https:" ? "wss" : "ws";
const wsEndpoint = `${websocketProtocol}://${window.location.host}/ws/notifications/`;

socket = new WebSocket(wsEndpoint);

socket.onopen = (event) => {
    console.log("WebSocket connection opened!");
};

socket.onmessage = function(e) {
    const data = JSON.parse(e.data);
    const notification = data.notification;

    createNewNotificationElement(notification);

    const notificationCountElement = document.getElementById('notification-count');
    if (notificationCountElement) {
        let count = parseInt(notificationCountElement.innerText) || 0;
        notificationCountElement.innerText = count + 1;
    }
};

socket.onclose = function(e) {
    console.log('Websocket close.!');
};

function createNewNotificationElement(notification) {
    const notificationList = document.querySelector('.header_dropdown ul');

    // Tạo phần tử li mới
    const newNotification = document.createElement('li');
    newNotification.classList.add('not-read', 'mb-3', 'mt-3');

    // Nội dung của thông báo
    newNotification.innerHTML = `
        <a href="#">
            <div class="drop_avatar">
                <img src="${notification.sender_image_url}" alt="">
            </div>
            <span class="drop_icon bg-gradient-primary">
                <i class="fas fa-thumbs-up"></i>
            </span>
            <div class="drop_text">
                <p>
                    <strong>${notification.sender}</strong> Liked your post
                    <span class="text-link">${notification.post_title}</span>
                </p>
                <time> <small>just now</small> </time>
            </div>
        </a>
    `;

    // Chèn thông báo mới vào đầu danh sách thông báo
    notificationList.insertBefore(newNotification, notificationList.firstChild);
}

$(document).on("click", "#notification-icon", function (e) {
    $.ajax({
        url: "update-notifications/",
        dataType: "json",
        success: function (response) {
            if (response.status === "success") {
                $("#notification-count").text("0");
            }
        },
        error: function (xhr, status, error) {
            console.log("Error:", error);
        }
    });
});