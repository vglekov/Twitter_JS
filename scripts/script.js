class FetchData {
    getResource = async url => {
      const res = await fetch(url);
  
      if (!res.ok) {
        throw new Error("Произошла ошибка:" + res.status);
      }
  
      return res.json();
    }
  
    getPost = async () => await this.getResource('db/database.json');
  }
  
  class Twitter {
    constructor({ listElem, user, modalElems, tweetElems, avatarElems, classDeleteTweet, classLikeTweet, sortElem, showUserPostElem, showLikedPostElem }) {
      const fetchData = new FetchData();
      this.tweets = new Posts();
      this.user = user;
      this.elements = {
        listElem: document.querySelector(listElem),
        sortElem: document.querySelector(sortElem),
        modal: modalElems,
        tweetElems,
        avatarElems,
        showUserPostElem: document.querySelector(showUserPostElem),
        showLikedPostElem: document.querySelector(showLikedPostElem),
      }
      this.cssClass = {
        classDeleteTweet,
        classLikeTweet,
      }
      this.sortDate = true;
  
      fetchData.getPost()
        .then(data => {
          data.forEach(this.tweets.addPost);
  
          this.showAllPost();
        });
  
      this.elements.modal.forEach(this.handlerModal, this);
      this.elements.tweetElems.forEach(this.addTweet, this);
  
      //Заменить аватар
      this.setAvatarOfLoginnedUser(this.elements.avatarElems, this.user.avatar);
  
      this.elements.listElem.addEventListener('click', this.handlerTweet);
      this.elements.sortElem.addEventListener('click', this.changeSort);
  
      this.elements.showUserPostElem.addEventListener('click', this.showUserPost)
      this.elements.showLikedPostElem.addEventListener('click', this.showLikesPost)
    }
  
  
    setAvatarOfLoginnedUser(avatarElems, avatarPathCss) {
      //Если у user есть аватар, то ставим, если нет, то не трогаем и будет стоять аватар по умолчанию который в верстке
      if (avatarPathCss) {
        const avatars = [];
        avatarElems.forEach(avatarElem => avatars.push(document.querySelectorAll(avatarElem)));
  
        avatars.forEach(avatarItem => {
          if (avatarItem.length > 1) {
            avatarItem.forEach(item => item.setAttribute('src', avatarPathCss));
          } else {
            avatarItem[0].setAttribute('src', avatarPathCss)
          }
        });
      }
    }
  
    renderPosts(posts) {
      const sortPost = posts.sort(this.sortFields());
      this.elements.listElem.textContent = '';
  
      sortPost.forEach(({ id, userName, nickname, postDate, text, img, likes, liked, getDate }) => {
        this.elements.listElem.insertAdjacentHTML('beforeend', `
          <li>  
            <article class="tweet">
              <div class="row">
                <img class="avatar" src="images/${nickname}.jpg" alt="Аватар пользователя ${nickname}">
                <div class="tweet__wrapper">
                  <header class="tweet__header">
                    <h3 class="tweet-author">${userName}
                      <span class="tweet-author__add tweet-author__nickname">@${nickname}</span>
                      <time class="tweet-author__add tweet__date">${getDate()}</time>
                    </h3>
                    <button class="tweet__delete-button chest-icon" data-id="${id}"></button>
                  </header>
                  <div class="tweet-post">
                    <p class="tweet-post__text">${text}</p>
                    ${img ?
            `<figure class="tweet-post__image">
                          <img src="${img}" alt="иллюстрация из поста ${nickname}.">
                        </figure>`
            : ' '
          }
                  </div>
                </div>
              </div>
              <footer>
                <button class="tweet__like ${liked ? this.cssClass.classLikeTweet.active : ''}" data-id="${id}">
                  ${likes}
                </button>
              </footer>
            </article>
          </li>
        `)
      });
    }
  
    showUserPost = () => {
      const userPosts = this.tweets.posts.filter(item => item.nickname === this.user.nick);
      this.renderPosts(userPosts);
    }
  
    showLikesPost = () => {
      const likedPosts = this.tweets.posts.filter(item => item.liked);
      this.renderPosts(likedPosts);
    }
  
    showAllPost() {
      this.renderPosts(this.tweets.posts)
    }
  
    handlerModal({ button, modal, overlay, close }) {
      const buttonElem = document.querySelector(button);
      const modalElem = document.querySelector(modal);
      const overlayElem = document.querySelector(overlay);
      const closeElem = document.querySelector(close);
  
      const openModal = () => {
        modalElem.style.display = "block";
      }
  
      const closeModal = (elem, event) => {
        if (event.target === elem) {
          modalElem.style.display = 'none';
        }
      }
  
      buttonElem.addEventListener('click', openModal);
  
      if (closeElem) {
        closeElem.addEventListener('click', closeModal.bind(null, closeElem));
      }
      if (overlayElem) {
        overlayElem.addEventListener('click', closeModal.bind(null, overlayElem));
      }
  
      this.handlerModal.closeModal = () => modalElem.style.display = "none";
    }
  
    addTweet({ text, img, submit }) {
      const textElem = document.querySelector(text);
      const imgElem = document.querySelector(img);
      const submitElem = document.querySelector(submit);
  
      //По умолчанию кнопка недоступна
      submitElem.disabled = true;
  
      let imgUrl = '';
      let tempString = textElem.innerHTML;
  
      submitElem.addEventListener('click', () => {
        this.tweets.addPost({
          userName: this.user.name,
          nickname: this.user.nick,
          text: textElem.innerHTML,
          img: imgUrl,
        });
  
        this.showAllPost();
        this.handlerModal.closeModal();
        textElem.innerHTML = tempString;
      });
  
      textElem.addEventListener('click', () => {
        if (textElem.innerHTML === tempString) {
          textElem.innerHTML = '';
        }
      });
  
      //Слушаем textarea на изменения, если проверка выполнена, то кнопку можно нажать
      textElem.addEventListener("DOMSubtreeModified", () => {
        if (textElem.textContent !== tempString && textElem.textContent !== '') {
          submitElem.disabled = false;
        } else {
          submitElem.disabled = true;
        }
      })
  
      imgElem.addEventListener('click', () => {
        imgUrl = prompt('Введите адрес изображения');
      });
    }
  
    handlerTweet = event => {
      if (event.target.classList.contains(this.cssClass.classDeleteTweet)) {
        this.tweets.deletePost(event.target.dataset.id);
        this.showAllPost();
      }
  
      if (event.target.classList.contains(this.cssClass.classLikeTweet.like)) {
        this.tweets.likePost(event.target.dataset.id);
        this.showAllPost()
      }
    }
  
    changeSort = () => {
      this.sortDate = !this.sortDate;
      this.showAllPost();
    }
  
    sortFields() {
      if (this.sortDate) {
        return (a, b) => {
          const dateA = new Date(a.postDate);
          const dateB = new Date(b.postDate);
          return dateB - dateA;
        }
      } else {
        return (a, b) => b.likes - a.likes;
      }
    }
  }
  
  class Posts {
    constructor({ posts = [] } = {}) {
      this.posts = posts;
    }
  
    addPost = tweet => {
      this.posts.push(new Post(tweet));
    }
  
    deletePost(id) {
      this.posts = this.posts.filter(item => item.id !== id);
    }
  
    likePost(id) {
      this.posts.forEach(item => {
        if (item.id === id) {
          item.changeLike();
        }
      });
    }
  }
  
  class Post {
    constructor(param) {
      const { id, userName, nickname, postDate, text, img, likes = 0 } = param;
      this.id = id ? id : this.generateId();
      this.userName = userName;
      this.nickname = nickname;
      this.postDate = postDate ? this.correctDate(postDate) : new Date();
      this.text = text;
      this.img = img;
      this.likes = likes;
      this.liked = false;
    }
  
    changeLike() {
      this.liked = !this.liked;
      if (this.liked) {
        this.likes++;
      } else {
        this.likes--;
      }
    }
  
    generateId() {
      return Math.random().toString(32).substring(2, 9) + (+new Date()).toString(32);
    }
  
    getDate = () => {
      const options = {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
      return this.postDate.toLocaleString('ru-RU', options);
    }
  
    correctDate(date) {
      if (isNaN(Date.parse(date))) {
        date = date.replace(/\./g, '/');
      }
      return new Date(date);
    }
  }
  
  const twitter = new Twitter({
    listElem: ".tweet-list",
    user: {
      name: 'viacheslav',
      nick: 'slava',
  
      //Путь к аватарке юзера
      avatar: 'images/slava.jpg'
    },
    modalElems: [
      {
        button: '.header__link_tweet',
        modal: '.modal',
        overlay: '.overlay',
        close: '.modal-close__btn',
      },
    ],
    tweetElems: [
      {
        text: '.modal .tweet-form__text',
        img: '.modal .tweet-img__btn',
        submit: '.modal .tweet-form__btn',
      },
  
      //Передаю еще один tweetElem, который уже не в modal. Так как querySelector, используемый мной при поиске элементов берет первый попавшийся результат, он возьмет поле создания твита в начале страницы(наверное)
      {
        text: '.tweet-form__text',
        img: '.tweet-img__btn',
        submit: '.tweet-form__btn',
      },
    ],
  
    //Элементы где нужно заменить аватар по умолч. на аватар of user
    avatarElems: ['.tweet-form__avatar', '.header .avatar'],
  
    classDeleteTweet: 'tweet__delete-button',
    classLikeTweet: {
      like: "tweet__like",
      active: "tweet__like_active"
    },
    sortElem: '.header__link_sort',
    showUserPostElem: '.header__link_profile',
    showLikedPostElem: '.header__link_likes',
  });