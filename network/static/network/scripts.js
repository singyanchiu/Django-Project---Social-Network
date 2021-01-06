document.addEventListener('DOMContentLoaded', function() {

    // Use buttons to toggle between views
    document.querySelector('#all-posts').addEventListener('click', () => load_posts('all', 1));
    if (document.getElementById("following")){
      document.querySelector('#following').addEventListener('click', () => load_posts('following', 1));
    }
    if (document.getElementById("compose-form")) {
      document.querySelector('#compose-form').addEventListener('submit', submit_post);
    }

    // By default, load the inbox
    load_posts('all', 1);
  });

function load_profile(id) {
  document.querySelector('#posts-view-javascript').style.display = 'none';
  if (document.getElementById("compose-form")) {
    document.querySelector('#compose-form').style.display = 'none';
  }
  document.querySelector('#profile-view').style.display = 'block';
  document.querySelector('#profile-view').innerHTML = "";
  console.log(id);
  fetch(`/user/${id}`)
  .then(response => response.json())
  .then(user => {
    var header, followers, following, button;
    element = document.createElement('div');
    element.className = 'profile';
    header = `<div class="user"><strong style="font-size: 22px;">${user.user}</strong></div>`;
    followers = `<div class="user"><strong>Followers: </strong>${user.followers_count}</div>`;
    following = `<div class="user"><strong>Following: </strong>${user.following_count}</div>`;
    if (user.status==='other'){
      button = `<button type="button" onclick="follow('follow', ${id})" class="btn btn-primary btn-sm">Follow</button>`;
    } else if (user.status==='following') {
      button = `<button type="button" onclick="follow('unfollow', ${id})" class="btn btn-primary btn-sm">Unfollow</button>`;
    } else {
      button = "";
    } 
    element.innerHTML = header + followers + following + button + "<hr>";
    document.querySelector('#profile-view').append(element);
  }).then(setTimeout(() => {load_posts(`${id}`, 1);}, 50));
}

function follow(action, id) {
  var csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
  // var csrftoken = getCookie('csrftoken');
  var request = new Request(
    `/user/${id}`,
    {headers: {'X-CSRFToken': csrftoken}}
  )
  fetch(request, {
    method: 'PUT',
    mode: 'same-origin',
    body: JSON.stringify({
        action: action
        })
    })
    .then(response => response.json())
    .then(result => {console.log(result);})
    .then(setTimeout(() => {load_profile(id);}, 50));
}

function load_posts(action, page) {
  // Show the posts and hide other views
  if (action==='all' || action==='following') {
    document.querySelector('#profile-view').style.display = 'none';
    if (document.getElementById("compose-form")) {
      document.querySelector('#compose-form').style.display = 'block';
      document.querySelector('#post-body').value = '';
    }
  } else {
    if (document.getElementById("compose-form")) {
      document.querySelector('#compose-form').style.display = 'none';
    }
  }
  document.querySelector('#posts-view-javascript').style.display = 'block';

  // GET request to fetch posts
  fetch(`/posts/${action}?page=${page}`)
  .then(response => response.json())
  .then(posts => {
      console.log(posts);
      document.querySelector('#posts-view-javascript').innerHTML = "";
      var title, title_div, element, header, timestamp, body, likes, edit;
      title_div = document.createElement('div');
      if (action==='all') {
        title = `<div class="title">All Posts</div>`;
      } else if (action==='following') {
        title = `<div class="title">Following</div>`;
      } else {
        title = `<div class="title">${posts[1].user}'s Posts</div>`;
      }
      title_div.innerHTML = title;
      document.querySelector('#posts-view-javascript').append(title_div);
      posts.forEach(post => {
        if (post.id) {

          //Display post
          element = document.createElement('div');
          element.className = 'post-box';
          element.id = `${post.id}`;
          header = `<div class="user" onclick="load_profile(${post.user_id})"><strong style="cursor: pointer;">${post.user}</strong><br></div>`;
          timestamp = `<div class="timestamp">${convert_timezone(post.timestamp)}<br></div>`;
          body = `<div class="body" id="body-${post.id}">${post.body}</div>`;
          likes = (parseInt(post.liked) == 1)?
          `<div id="like-button-${post.id}" data-value="${post.likes}"><div class="likes" onclick="toggle_like(${post.id},'unlike')">&#10084;<span style="color:black;">&nbsp;${post.likes}</span></div></div>`:
          `<div id="like-button-${post.id}" data-value="${post.likes}"><div class="likes" onclick="toggle_like(${post.id},'like')" id="like-button-${post.id}" data-value="${post.likes}"><div style="font-size:22px; line-height:105%; float:left;">&#9825</div><span style="color:black; ">&nbsp;${post.likes}</span></div></div>`;
          edit = "";
          if (post.owner) {
            edit = `<div id="edit-${post.id}"><span class="edit" onclick="edit(${post.id})" style="cursor: pointer;">Edit</span></div>`;
          }
          element.innerHTML = header + timestamp + body + edit + likes;
          document.querySelector('#posts-view-javascript').append(element);
        } else {

          //Display Pagination
          //Only display previous and next buttons if there are more than one page
          if (post.num_pages>1) {
            element = document.createElement('ul');
            element.className = 'pagination';
            if (post.has_previous==true) {
              var previous_page = post.previous_page_number;
              var previous = `<li class="page-item"><a class="page-link" href="#"  onclick="load_posts('${action}', ${previous_page})">Previous</a></li>`;
            } else {
              var previous = `<li class="page-item disabled"><a class="page-link" href="#">Previous</a></li>`;
            }
  
            if (post.has_next==true) {
              var next_page = post.next_page_number;
              var next = `<li class="page-item"><a class="page-link" href="#" onclick="load_posts('${action}', ${next_page})">Next</a></li>`;
            } else {
              var next = `<li class="page-item disabled"><a class="page-link" href="#">Next</a></li>`;
            }
            element.innerHTML = previous + next;
            document.querySelector('#posts-view-javascript').append(element);
            console.log(post.has_previous);
            console.log(post.has_next);
          }
          element = document.createElement('div');
          element.className = 'timestamp';
          element.innerHTML = `Page ${page} of ${post.num_pages}`;
          document.querySelector('#posts-view-javascript').append(element);
          // `<strong>Total number of pages: ${post.num_pages} </strong>` +
          // `<strong>has_previous: ${post.has_previous} </strong>` +
          // `<strong>has_other_pages: ${post.has_other_pages} </strong>` +
          // `<strong>next_page_number: ${post.next_page_number} </strong>` +
          // `<strong>previous_page_number: ${post.previous_page_number} </strong>`
        }
      });
  });
}

function toggle_like (id, action) {
  //submit PUT request to update post in the server
  if (!document.querySelector('[name=csrfmiddlewaretoken]')) {
    return false;
  }
  var csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
  var request = new Request(
    `/like/${action}/${id}`,
    {headers: {'X-CSRFToken': csrftoken}}
  )
  fetch(request, {
    method: 'PUT',
    mode: 'same-origin',
    body: JSON.stringify({
        id: id,
        action: action
    })
  })
  .then(response => response.json())
  .then(result => {console.log(result)})
  .then(() => {
     //Update DOM
    var element = document.getElementById(`like-button-${id}`);
    var likes = element.dataset.value;
    console.log(likes);
    if (action==='like') {
      likes++;
      element.dataset.value = likes;
      element.innerHTML =
      `<div class="likes" onclick="toggle_like(${id},'unlike')">&#10084;<span style="color:black;">&nbsp;${likes}</span></div>`;
    } else {
      likes--;
      element.dataset.value = likes;
      element.innerHTML =
      `<div class="likes" onclick="toggle_like(${id},'like')"><div style="font-size:22px; line-height:105%; float:left;">&#9825</div><span style="color:black; ">&nbsp;${likes}</span></div>`;
    }
  });
}

function edit(id) {
  var body = document.getElementById(`body-${id}`).innerHTML;
  console.log(`body-${id}`);
  console.log(body);
  document.getElementById(`body-${id}`).innerHTML = `<textarea id="textarea-${id}" rows="4" cols="30">${body}</textarea>`;
  document.getElementById(`edit-${id}`).innerHTML = 
  `<div class="edit" style="cursor: pointer;">` +
  `<span onclick="save_edit(${id})">Save</span>`;
}

function save_edit(id) {
  //submit fetch request to update post in the server
  var body = document.getElementById(`textarea-${id}`).value;
  var csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
  var request = new Request(
    '/post',
    {headers: {'X-CSRFToken': csrftoken}}
  )
  fetch(request, {
    method: 'PUT',
    mode: 'same-origin',
    body: JSON.stringify({
        body: body,
        id: id
    })
  })
  .then(response => response.json())
  .then(result => {console.log(result)})
  .then(() => {
    //Update DOM with the new post and change the save button back to edit
    document.getElementById(`body-${id}`).innerHTML = body;
    document.getElementById(`edit-${id}`).innerHTML = `<div class="edit" onclick="edit(${id})" style="cursor: pointer;">Edit</div>`;
  });
}

function submit_post(event) {
  var body = document.getElementById('post-body').value;
  var csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
  // var csrftoken = getCookie('csrftoken');
  var request = new Request(
    '/post',
    {headers: {'X-CSRFToken': csrftoken}}
  )
  fetch(request, {
    method: 'POST',
    mode: 'same-origin',
    body: JSON.stringify({
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);
  }).then(setTimeout(() => {load_posts('all',1);}, 50));  
  event.preventDefault();
}
  
function convert_timezone(date_string) {
  var date = new Date(date_string);
  return date.toDateString()+', '+date.toLocaleTimeString();
}

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i].trim();
          // Does this cookie string begin with the name we want?
          if (cookie.substring(0, name.length + 1) === (name + '=')) {
              cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
              break;
          }
      }
  }
  return cookieValue;
}