/** @jsx React.DOM */

var React = require('react');
var Tweets = require('./Tweets.react.js');
var Loader = require('./Loader.react.js');
var NotificationBar = require('./NotificationBar.react.js');

module.exports = TweetsApp = React.createClass({

	// Method to add a tweet to our timeline
	addTweet: function (tweet) {
		
		// Get current application state
		var updated = this.state.tweets;

		// Increment the unread count
		var count = this.state.count + 1;

		// Increment the skip count
		var skip = this.state.skip + 1;

		// Add tweet to the beginning of the tweets array
		updated.unshift(tweet);

		// Set application state
		this.setState({tweets: updated, count: count, skip: skip});

	},

	// Method to get JSON from server by page
	getPage: function (page) {
		
		// Setup our ajax request
		var request = new XMLHttpRequest, self = this;
		request.open('GET', 'page/' + page + "/" + this.state.skip, true);
    	request.onload = function() {
			
			// If everything is cool...
			if (request.status >= 200 && request.status < 400) {

				// Load our next page
				self.loadPagedTweets(JSON.parse(request.responseText));

			} else {

		        // Set application state (Not paging, paging complete)
		        self.setState({paging: false, done: true});

			}

		}

		// Fire!
		request.send();
	},

	// Method to show the unread tweets
	showNewTweets: function () {
		
		// Get current application state
	    var updated = this.state.tweets;

	    // Mark our tweets active
	    updated.forEach(function(tweet){
	      tweet.active = true;
	    });

	    // Set application state (active tweets + reset unread count)
	    this.setState({tweets: updated, count: 0});

	},

	// Method to load tweets fetched from the server
	loadPagedTweets: function (tweets) {
		
		var self = this;

		if (tweets.length > 0) {

			var updated = this.state.tweets;

			tweets.forEach(function(tweet){
				updated.push(tweet);
			});

			// This app is so fast, I actually use a timeout for dramatic effect
			setTimeout(function () {
				self.setState({tweets: updated, paging: false});
			}, 1000);

		} else {

			// Set application state (Not paging, paging complete)
			this.setState({done: true, paging: false});

		}

	},

	// Method to check if more tweets should be loaded, by scroll position
	checkWindowScroll: function () {
		
		// Get scroll pos & window data
		var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
		var s = document.body.scrollTop;
		var scolled = (h + s) > document.body.offsetHeight;

		// If scrolled enough, not currently paging and not complete...
		if (scrolled && !this.paging && !this.state.done) {

			// Set application state (Paging, Increment page)
			this.setState({paging: true, page: this.state.page + 1});

			// Get the next page of tweets from the server
			this.getPage(this.state.page);

		}
	},

	// Set the initial component state
	getInitialState: function(props) {

		props = props || this.props;

		// Set initial application state using props
		return {
			tweets: props.tweets,
			count: 0,
			page: 0,
			paging: false,
			skip: 0,
			done: false
		};

	},

	componentWillReceiveProps: function(newProps, oldProps) {
		this.setState(this.getInitialState(newProps));
	},

	componentDidMount: function() {
		var self = this;

		var socket = io.connect();
		
		socket.on('tweet', function (data) {
			// Add a tweet to our queue
			self.addTweet(data);
		});

		// Attach scroll event to the window for ininity paging
		window.addEventListener('scroll', this.checkWindowScroll);

	},

	// Render the component
	render: function() {

		return (
			<div className="tweets-app">
				<Tweets tweets={this.state.tweets}/>
				<Loader paging={this.state.paging}/>
        		<NotificationBar count={this.state.count} onShowNewTweets={this.showNewTweets}/>
			</div>
		)

	}

});