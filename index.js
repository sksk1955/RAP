document.getElementById('fetch-posts').addEventListener('click', fetchPosts);

function fetchPosts() {
    const postsContainer = document.getElementById('posts-container');
    postsContainer.innerHTML = '<div class="loading">Loading...</div>';

    fetch('https://jsonplaceholder.typicode.com/posts')
        .then(response => response.json())
        .then(posts => {
            const userPromises = posts.map(post => fetch(`https://jsonplaceholder.typicode.com/users/${post.userId}`).then(response => response.json()));
            return Promise.all(userPromises)
                .then(users => posts.map((post, index) => ({ ...post, user: users[index] })));
        })
        .then(postsWithUsers => {
            postsContainer.innerHTML = '';
            postsWithUsers.forEach(post => renderPost(post));
            document.getElementById('total-posts').textContent = postsWithUsers.length;
            return postsWithUsers;
        })
        .then(postsWithUsers => fetchCommentsForPosts(postsWithUsers))
        .catch(error => {
            postsContainer.innerHTML = `<div class="error">Error fetching posts: ${error}</div>`;
        });
}

function fetchCommentsForPosts(posts) {
    const commentPromises = posts.map(post => fetch(`https://jsonplaceholder.typicode.com/comments?postId=${post.id}`).then(response => response.json()));
    return Promise.all(commentPromises)
        .then(commentsArray => {
            commentsArray.forEach((comments, index) => {
                posts[index].comments = comments;
            });
            updateTopCommentPost(posts);
        });
}

function updateTopCommentPost(posts) {
    const topPost = posts.reduce((max, post) => post.comments.length > max.comments.length ? post : max, posts[0]);
    document.getElementById('top-post-title').textContent = `Title: ${topPost.title}`;
    document.getElementById('top-post-body').textContent = `Body: ${topPost.body}`;
    document.getElementById('top-post-author').textContent = `Author: ${topPost.user.name} (${topPost.user.email})`;
    document.getElementById('top-post-comments').textContent = `Comments: ${topPost.comments.length}`;
}

function renderPost(post) {
    const postsContainer = document.getElementById('posts-container');
    const postElement = document.createElement('div');
    postElement.classList.add('post');
    postElement.innerHTML = `
        <h2>${post.title}</h2>
        <p>${post.body}</p>
        <div class="user-info">Posted by: ${post.user.name} (${post.user.email})</div>
    `;
    postElement.addEventListener('click', () => toggleComments(post.id, postElement));
    postsContainer.appendChild(postElement);
}

function toggleComments(postId, postElement) {
    const existingComments = postElement.querySelector('.comments');
    if (existingComments) {
        postElement.removeChild(existingComments);
    } else {
        fetch(`https://jsonplaceholder.typicode.com/comments?postId=${postId}`)
            .then(response => response.json())
            .then(comments => {
                const commentsSection = document.createElement('div');
                commentsSection.classList.add('comments');
                commentsSection.innerHTML = '<h3>Comments:</h3>';
                comments.forEach(comment => {
                    const commentElement = document.createElement('div');
                    commentElement.innerHTML = `
                        <p><strong>${comment.name}</strong>: ${comment.body}</p>
                    `;
                    commentsSection.appendChild(commentElement);
                });
                postElement.appendChild(commentsSection);
            })
            .catch(error => {
                const errorElement = document.createElement('div');
                errorElement.classList.add('error');
                errorElement.textContent = `Error fetching comments: ${error}`;
                postElement.appendChild(errorElement);
            });
    }
}
