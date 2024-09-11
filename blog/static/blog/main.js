document.addEventListener('DOMContentLoaded', function () {
    const likeButtons = document.querySelectorAll('.post-rating-button.material-icons[post-id]');

    likeButtons.forEach(button => {
        button.addEventListener('click', function () {
            const postId = this.getAttribute('post-id');
            fetch(`/like-post/${postId}/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'),
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
                .then(response => {
                    if (response.status === 302) {
                        // Redirect to login page
                        window.location.href = '/login/';
                        return;
                    }
                    return response.json();
                })
                .then(data => {
                    const likeCountSpan = document.getElementById(`like-count-${postId}`);
                    likeCountSpan.innerText = data.likes_count;

                    // Chuyển đổi trạng thái liked/unliked
                    if (data.liked) {
                        this.setAttribute('status', 'true');
                        this.classList.add('liked');
                    } else {
                        this.setAttribute('status', 'false');
                        this.classList.remove('liked');
                    }
                })
                .catch(error => console.error('Error:', error));
        });
    });
});

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

document.addEventListener('DOMContentLoaded', function () {
    var submitButtons = document.querySelectorAll('.submit-comment');

    submitButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            var postId = this.getAttribute('data-post-id');
            var content = document.querySelector(`#comment-input-${postId}`).value;
            var replyToCommentId = this.closest('.comments-input').getAttribute("data-reply-to-comment-id")

            if (replyToCommentId) {
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
            }
            else {
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
            };
        });
    })
});



document.addEventListener('DOMContentLoaded', function () {
    var commentButtons = document.querySelectorAll('.post-rating-button.comment');

    commentButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            var article = this.closest('article');
            var commentsContainer = article.querySelector('.comments-container');
            var commentInput = article.querySelector('.comments-input');

            if (commentsContainer.style.display === 'none' || commentsContainer.style.display === '') {
                commentsContainer.style.display = 'block';
                commentInput.style.display = 'flex';
            } else {
                commentsContainer.style.display = 'none';
                commentInput.style.display = 'none';  // Ẩn phần input
            }
        });
    });
});

document.addEventListener('DOMContentLoaded', function () {
    var replyButton = document.querySelectorAll('.fa-reply')
    var replyToComment = document.querySelector('.comments-reply')
    var replyToCommentText = document.getElementById('reply-to-comment')

    replyButton.forEach(function (button) {
        button.addEventListener('click', function () {
            var commentBox = this.closest('.comment-box');
            var commentAuthor = commentBox.querySelector('.comment-name a').innerText;
            var commentsInputContainer = this.closest('article').querySelector('.comments-input');
            var commentId = commentBox.getAttribute('data-comment-id')

            commentsInputContainer.setAttribute('data-reply-to-comment-id', commentId)
            replyToCommentText.innerText = 'Replying to ' + commentAuthor;
            replyToComment.style.display = 'flex';
        })
    })
})

$(document).on("click", "#add-friend", function(){
    let id = $(this).attr("data-friend-id");
    let $this = $(this); // Lưu trữ tham chiếu đến phần tử đang click
    console.log(id);

    $.ajax({
        url: "/add-friend/",
        dataType: "json",
        data: {
            "id": id
        },
        success: function(response){
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

$(document).on("click", "#accept-friend-request", function() {
    let id = $(this).attr("data-request-id");
    console.log(id);

    $.ajax({
        url: "/accept-friend-request/",
        dataType: "json",
        data: {
            "id": id
        },
        success: function(response) {
            console.log(response.data);
            // Ẩn nút reject
            $(".reject-friend-request-hide" + id).hide()
            // Thay đổi nội dung nút accept
            $(".accept-friend-request" + id).html("<i class='fas fa-check-circle'></i> Friend Request Accepted");
            $(".accept-friend-request" + id).addClass("text-white");
        }
    });
});

$(document).on("click", "#reject-friend-request", function(){
    let id = $(this).attr("data-request-id")
    console.log(id);

    $.ajax({
        url: "/reject-friend-request/",
        dataType: "json",
        data: {
            "id":id
        },
        success: function(response){
            console.log(response.data);
            $(".accept-friend-request-hide"+id).hide()
            $(".reject-friend-request"+id).html("<i class='fas fa-check-circle'></i> Friend Request Rejected")
            $(".reject-friend-request"+id).addClass("text-white")
        }
    })
})

// UnFriend User
$(document).on("click", "#unfriend", function(){
    let id = $(this).attr("data-friend-id")
    console.log(id);

    $.ajax({
        url: "/unfriend/",
        dataType: "json",
        data: {
            "id":id
        },
        success: function(response){
            console.log(response);
            $("#unfriend-text").html("<i class='fas fa-check-circle'></i> Friend Removed ")
            $(".unfriend"+id).addClass("bg-blue-600")
            $(".unfriend"+id).removeClass("bg-red-600")
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