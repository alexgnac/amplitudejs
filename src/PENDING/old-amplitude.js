/*
	Amplitude.js
	Version: 2.4
*/
var Amplitude = (function () {
/*
|----------------------------------------------------------------------------------------------------
| Module Variables
|----------------------------------------------------------------------------------------------------
| These variables make Amplitude run. The config is the most important
| containing active settings and parameters. The Web Audio API variables
| for visualizations are below.
*/

	/*--------------------------------------------------------------------------
		The config JSON is the global settings for ALL of Amplitude functions.
		This is global and contains all of the user preferences. The default
		settings are set, and the user overwrites them when they initialize
		Amplitude.
	--------------------------------------------------------------------------*/
	var config = {
		/*
			The audio element we will be using to handle all of the audio. This
			is the javascript version of the HTML5 audio element.
		*/
		active_song: new Audio(),

		/*
			JSON object that contains the active metadata for the song.
		*/
		active_metadata: {},

		/*
			String to hold the active album name. Used to check and see if the
			album changed and run the album changed callback.
		*/
		active_album: '',

		/*
			Contains the index of the actively playing song.
		*/
		active_index: 0,

		/*
			Contains the key to the active playlist index.
		*/
		active_playlist: '',

		/*
			Set to true to autoplay the song
		*/
		autoplay: false,

		/*
			Sets the initial playback speed of the song. The values
			for this can be 1.0, 1.5, 2.0
		*/
		playback_speed: 1.0,

		/*
			Used to determine if the album has changed and run the callback if it
			has.
		*/
		album_change: false,

		/*
			The user can pass a JSON object with a key => value store of callbacks
			to be run at certain events.
		*/
		callbacks: {},

		/*
			Object containing all of the songs the user has passed to Amplitude
			to use.
		*/
		songs: {},

		/*
			Object containing all of the playlists the user created.
		*/
		playlists: {},

		/*
			Object that will contain shuffled playlists.
		*/
		shuffled_playlists: {},

		/*
			Object that contains whether the current playlist is in 
			shuffle mode or not.
		*/
		shuffled_statuses: {},

		/*
			When repeat is on, when the song ends the song will replay itself.
		*/
		repeat: false,

		/*
			When shuffled, this gets populated with the songs the user provided
			in a random order.
		*/
		shuffle_list: {},

		/*
			When shuffled is turned on this gets set to true so when traversing
			through songs Amplitude knows whether or not to use the songs object
			or the shuffle_list.
		*/
		shuffle_on: false,

		/*
			When shuffled, this index is used to let Amplitude know where it's
			at when traversing.
		*/
		shuffle_active_index: 0,

		/*
			The user can set default album art to be displayed if the song they
			set doesn't contain album art.
		*/
		default_album_art: '',

		/*
			When set to true, Amplitude will print to the console any errors
			that it runs into providing helpful feedback to the user.
		*/
		debug: false,

		/*
			When Amplitude finishes initializing, this is set to true. When set
			to true, Amplitude cannot be initialized again preventing double
			event handlers.
		*/
		initialized: false,

		/*
			By default this is true, but if the user wanted to hard code elements
			with song data, they could set this to false and Amplitude wouldn't 
			edit the now playing information in elements.
		*/
		handle_song_elements: true,

		/*
			The user can set the initial volume to a number between 0 and 1
			overridding a default of .5.
		*/
		volume: .5,

		/*
			This is set on mute so that when a user un-mutes Amplitude knows
			what to restore the volume to.
		*/
		pre_mute_volume: .5,

		/*
			This is an integer between 1 and 100 for how much the volume should
			increase when the user presses a volume up button.
		*/
		volume_increment: 5,

		/*
			This is an integer between 1 and 100 for how much the volume should
			decrease when the user presses a volume down button.
		*/
		volume_decrement: 5,

		/*
			To use visualizations with Amplitude, the user will set this to true.
			It is assumed that the user has thoroughly tested thier songs and have
			a back up plan in place if the browser doesn't support the Web Audio API.
			By doing this, we bypass a lot of unforseen errors with auto binding
			the web audio API to songs that don't need visualizations.
		*/
		use_visualizations: false,

		/*
			Handles all of the user registered visualizations if the user chooses
			to use visualizations in their design.
		*/
		visualizations: new Array(),

		/*
			Is set to the active visualization so Amplitude can detect changes
			per song if necessary.
		*/
		active_visualization: '',

		/*
			Holds the information the user defined about the current visualization,
			such as preferences.
		*/
		current_visualization: {},

		/*
			When the visualization is started, this is set to true.
		*/
		visualization_started: false,

		/*
			If the browser doesn't support visualizations, the user can provide
			a back up.  'nothing' is the default which removes the visualization
			element from the document. 'album-art' has Amplitude inject the now
			playing album art into the element that would have contained the
			visualization.
		*/
		visualization_backup: '',

		/*
			When using SoundCloud, the user will have to provide their API Client
			ID
		*/
		soundcloud_client: '',

		/*
			The user can set this to true and Amplitude will use the album art
			for the song returned from the Soundcloud API
		*/
		soundcloud_use_art: false,

		/*
			Used on config to count how many songs are from soundcloud and
			compare it to how many are ready for when to move to the rest
			of the configuration.
		*/
		soundcloud_song_count: 0,

		/*
			Used on config to count how many songs are ready so when we get
			all of the data from the SoundCloud API that we need this should
			match the SoundCloud song count meaning we can move to the rest
			of the config.
		*/
		soundcloud_songs_ready: 0,

		/*
			These are web audio API variables.  They connect the web audio
			api to the audio source allowing for visualization extensions.
			These variables are public and to be used for extensions.
			Initializes the variables if they are available.
		*/
		context: '',
		analyser: '',
		source: ''
	};

	/*--------------------------------------------------------------------------
		Used with SoundCloud to copy over the user config and add
		extra data so it doesn't interfere with the actual user
		config.
	--------------------------------------------------------------------------*/
	var temp_user_config = {};
	
/*
|----------------------------------------------------------------------------------------------------
| PUBLIC METHODS
|----------------------------------------------------------------------------------------------------
| These methods are available to the developer.  They allow the developer
| to change certain attributes if needed and configure the library.
|
| Method Prefix: public
|
| METHODS
|	publicInit( user_config )
|	publicSetDebug( state )
|	publicGetActiveSongMetadata()
|	publicRegisterVisualization( visualization, preferences )
|	publicChangeActiveVisualization( visualization )
|	publicVisualizationCapable()
|	publicGetSongByIndex( index )
|	publicAddSong( song )
|	publicPlayNow( song )
|	publicPlay()
|	publicPause()
|	publicGetAnalyser()	
|	
*/
	/*--------------------------------------------------------------------------
		The main init function.  The user will call this through 
		Amplitude.init({}) and pass in their settings.
		
		Public Accessor: Amplitude.init( user_config_json );

	 	@param user_config A JSON object of user defined values that help 
	 	configure and initialize AmplitudeJS.
	--------------------------------------------------------------------------*/
	function publicInit( user_config ){
		var ready = false;

		/*
			Reset the config on init so we have a clean slate. This is if the
			user has to re-init.
		*/
		privateHelpResetConfig();

		/*
			Initialize event handlers on init. This will clear any old
			event handlers on the amplitude element and re-bind what is
			necessary.
		*/
		privateHelpInitializeEventHandlers();

		/*
			In Amplitude there are 2 different types of song time visualizations.
			1st is the HTML5 range element. The 2nd is a div that gets filled in
			proportionately to the amount of time elapsed in the song. The user 
			can style this and represent the amount played visually. This
			initializes all of the 2nd type by inserting an element into each
			of the defined divs that will expand the width according to song
			played percentage.
		*/
		privateHelpInitializeSongTimeVisualizations();
		
		/*
			Initializes debugging right away so we can use it for the rest
			of the configuration.
		*/
		config.debug = ( user_config.debug != undefined ? user_config.debug : false );
		
		/*
			Checks to see if the user has songs defined.
		*/
		if( user_config.songs ){
			/*
				Checks to see if the user has some songs in the songs array.
			*/
			if( user_config.songs.length != 0 ){
				/*
					Copies over the user defined songs. and prepares
					Amplitude for the rest of the configuration.
				*/
				config.songs = user_config.songs;
				/*
					Flag amplitude as ready.
				*/
				ready = true;
			}else{
				privateWriteDebugMessage( 'Please add some songs, to your songs object!' );
			}
		}else{
			privateWriteDebugMessage( 'Please provide a songs object for AmplitudeJS to run!' );
		}

		/*
			To use visualizations with Amplitude, the user will have to explicitly state
			that their player uses visualizations.  Reason being is that the AudioContext
			and other filters can really mess up functionality if the user is not prepared
			to have them operate on their audio element.  If set to true, then the
			AudioContext and the other necessary elements will be bound for the Web Audio API
			to handle the visualization processing.
		*/
		config.use_visualizations = ( user_config.use_visualizations != undefined ? user_config.use_visualizations : false );
		
		/*
			Initializes the audio context. In this method it checks to see if the
			user wants to use visualizations or not before proceeding.
		*/
		privateHelpInitializeAudioContext();
		
		/*
			Checks if the user has any playlists defined. If they do
			we have to initialize the functionality for the playlists.
		*/
		if( user_config.playlists && privateHelpInitializeCountPlaylists( user_config.playlists ) > 0 ){
			/*
				Copy the playlists over to Amplitude
			*/
			config.playlists = user_config.playlists;
			
			/*
				Check to see if the user has valid song indexes in their playlist.
			*/
			privateHelpInitializeCheckValidSongsInPlaylists();

			/*
				Initialize the shuffle status of the playlists.
			*/
			privateHelpInitializePlaylistShuffleStatuses();
			
			/*
				Initialize temporary place holders for shuffle lists.
			*/
			privateHelpInitializePlaylistShuffleLists();
		}
		
		/*
			When the preliminary config is ready, we are ready to proceed.
		*/
		if( ready ){
			/*
				Copies over the soundcloud information to the global config
				which will determine where we go from there.
			*/
			config.soundcloud_client = ( user_config.soundcloud_client != undefined ? user_config.soundcloud_client : '' );
			
			/*
				Checks if we want to use the art loaded from soundcloud.
			*/
			config.soundcloud_use_art = ( user_config.soundcloud_use_art != undefined ? user_config.soundcloud_use_art : '' );
			
			/*
				If the user provides a soundcloud client then we assume that
				there are URLs in their songs that will reference SoundcCloud.
				We then copy over the user config they provided to the 
				temp_user_config so we don't mess up the global or their configs
				and load the soundcloud information.
			*/
			if( config.soundcloud_client != '' ){
				temp_user_config = user_config;

				/*
					Load up SoundCloud for use with AmplitudeJS.
				*/
				privateSoundCloudLoad();
			}else{
				/*
					The user is not using Soundcloud with Amplitude at this point
					so we just finish the configuration with the users's preferences.
				*/
				privateSetConfig( user_config );
			}
		}

		/*
			Debug out what was initialized with AmplitudeJS.
		*/
		privateWriteDebugMessage( 'Initialized With: ');
		privateWriteDebugMessage( config );
	}

	/*--------------------------------------------------------------------------
		Allows the user to turn on debugging.
		
		Public Accessor: Amplitude.setDebug( bool );
		
	 	@param BOOL state Turns debugging on and off.
	--------------------------------------------------------------------------*/
	function publicSetDebug( state ){
		/*
			Sets the global config debug on or off.
		*/
		config.debug = state;
	}

	/*--------------------------------------------------------------------------
		Returns the active song meta data for the user to do what is 
		needed.
		
		Public Accessor: Amplitude.getActiveSongMetadata();
		
	 	@returns JSON Object with the active song information
	--------------------------------------------------------------------------*/
	function publicGetActiveSongMetadata(){
		return config.active_metadata;
	}

	/*--------------------------------------------------------------------------
		Registers a visualization and sets that visualization's 
		preferences. When creating a visualization, you can set certain
		preferences that the user can overwrite similar to Amplitude.

		Public Accessor: Amplitude.registerVisualization( visualization, preferences )

		@param visualzation A visualization object that gets registered
		with Amplitude

		@param preferences A JSON object of preferences relating to the
		visualization
	--------------------------------------------------------------------------*/
	function publicRegisterVisualization( visualization, preferences ){
		/*
			Adds the visualization to the global config so it knows
			it can be used when playing songs.

			getID is a public function for getting a visualization's id.
			It becomes the key to access the visualization.
		*/
		config.visualizations[ visualization.getID ] = visualization;
		
		/*
			If defined, set the visualization preferences.
			setPreferences is a public function for connecting
			to a user defined visualization.
		*/
		if( preferences != undefined ){
			visualization.setPreferences( preferences );
		}
	}

	/*--------------------------------------------------------------------------
		Changes the active visualization. Could be called from a 
		user defined dropdown or whatever way the user wants to change a
		visualization dynamically.
		
		Public Accessor: Amplitude.changeVisualization( visualization )

		@param string visualization The name of the visualization
		that should be used.
	--------------------------------------------------------------------------*/
	function publicChangeActiveVisualization( visualization ){
		/*
			First we stop the active visualization. If the visualization
			is set up correctly, it should halt all callbacks, and clear
			the amplitude-visualization element.
		*/
		privateStopVisualization();

		/*
			Next we set the active visualization in the config.
		*/
		config.active_visualization = visualization;

		/*
			We then start the visualization hooks again.  This should
			insert itself into the amplitude-visualization element
			and bind the proper hooks.
		*/
		privateStartVisualization();
	}

	/*--------------------------------------------------------------------------
		Checks to see if the current browser is capable of running
		visualizations. If the AudioContext is available, then the browser
		can play the visualization.
		
		Public Accessor: Amplitude.visualizationCapable()
		
		@returns BOOL true if the browser can play the visualization and false
		if the browser cannot.
	--------------------------------------------------------------------------*/
	function publicVisualizationCapable(){
		if ( !window.AudioContext ) {
			return false;
		}else{
			return true;
		}
	}

	/*--------------------------------------------------------------------------
		Returns a song in the songs array at that index
		
		Public Accessor: Amplitude.getSongByIndex( song_index )

		@param int index The integer for the index of the
		song in the songs array.

		@returns JSON representation for the song at a specific index.
	--------------------------------------------------------------------------*/
	function publicGetSongByIndex( index ){
		return config.songs[index];
	}

	/*--------------------------------------------------------------------------
		Adds a song to the end of the config array.  This will allow Amplitude
		to play the song in a playlist type setting.
		
		Public Accessor: Amplitude.addSong( song_json )

		@param song JSON representation of a song.

		@returns int New index of the song.
	--------------------------------------------------------------------------*/
	function publicAddSong( song ){
		config.songs.push( song );
		return config.songs.length - 1;
	}

	/*--------------------------------------------------------------------------
		When you pass a song object it plays that song right awawy.  It sets
		the active song in the config to the song you pass in and synchronizes
		the visuals.
		
		Public Accessor: Amplitude.playNow( song_json )

		@param song JSON representation of a song.
	--------------------------------------------------------------------------*/
	function publicPlayNow( song ){
		/*
			Makes sure the song object has a URL associated with it
			or there will be nothing to play.
		*/
		if( song.url ){
			config.active_song.src 	= song.url;
			config.active_metadata 	= song;
			config.active_album 	= song.album;
		}else{
			privateWriteDebugMessage('The song needs to have a URL!');
		}
		
		/*
			Sets the main song control status visual
		*/
		privateChangePlayPauseState('playing');

		/*
			Calls the song change method that configures everything necessary for
			Amplitude when the song changes.
		*/
		privateAfterSongChanges();
	}

	/*--------------------------------------------------------------------------
		Allows the user to play whatever the active song is directly
		through Javascript. Normally ALL of Amplitude functions that access
		the core features are called through event handlers.

		Public Accessor: Amplitude.play();
	--------------------------------------------------------------------------*/
	function publicPlay(){
		privateCorePlay();
	}

	/*--------------------------------------------------------------------------
		Allows the user to pause whatever the active song is directly
		through Javascript. Normally ALL of Amplitude functions that access
		the core features are called through event handlers. 

		Public Accessor: Amplitude.pause();
	--------------------------------------------------------------------------*/
	function publicPause(){
		privateCorePause();
	}

	/*--------------------------------------------------------------------------
		Returns the analyser for visualization plugins to use.

		Public Accessor: Amplitude.analyser;
	--------------------------------------------------------------------------*/
	function publicGetAnalyser(){
		return config.analyser;
	}

/*
|----------------------------------------------------------------------------------------------------
| INITIALIZATION HELPER METHODS
|----------------------------------------------------------------------------------------------------
| These methods are called on initialization and configure the base
| functionality for Amplitude. They init event handlers and set up the
| song time visualizations, etc. These are helpers for the main initialization
|
| Method Prefix: privateHelpInitialize
|
| METHODS
|	privateHelpInitializeAudioContext( useVisualizations )
|	privateHelpInitializeCountPlaylists( playlists )
|	privateHelpInitializeCheckValidSongsInPlaylists()
|	privateHelpInitializePlaylistShuffleStatuses()
|	privateHelpInitializePlaylistShuffleLists()
|	privateHelpInitializeEventHandlers()
*/
	/*--------------------------------------------------------------------------
		Initializes the audio context if the user wants to use visualizations
		with their AmplitudeJS player.
	--------------------------------------------------------------------------*/
	function privateHelpInitializeAudioContext(){
		/*
			If the browser supports it and the user wants to use
			visualizations, then they can run visualizations. If
			the browser does not support the Web Audio API and the
			user has debug turned on, write to the console.
		*/
		if( window.AudioContext && config.use_visualizations ){
			/*
				Set the Web Audio API Context
			*/
			config.context 	= new AudioContext();

			/*
				Set the Web Audio API Analyzer to the context
			*/
			config.analyser = config.context.createAnalyser();

			/*
				Bind the source to the Javascript Audio Element
			*/
			config.source 	= config.context.createMediaElementSource( config.active_song );
			
			/*
				Connect the analyser to the source
			*/
			config.source.connect( config.analyser );
			
			/*
				Connect the context destination to the analyser
			*/
			config.analyser.connect( config.context.destination );

			/*
				Set cross origin to anonymouse so we have a better chance of being able
				to use the power of the Web Audio API.
			*/
			config.active_song.crossOrigin = "anonymous";
		}else{
			/*
				Checks to see if the Audio Context is available in the window meaning
				the browser can use the Web Audio API.
			*/
			if( !window.AudioContext ){
				privateWriteDebugMessage( 'This browser does not support the Web Audio API' );
			}
		}
	}

	/*--------------------------------------------------------------------------
		Counts the number of playlists the user has configured.
	--------------------------------------------------------------------------*/
	function privateHelpInitializeCountPlaylists( playlists ){
		/*
			Initialize the placeholders to iterate through the playlists
			and find out how many we have to account for.
		*/
		var size = 0, key;
		
		/*
			Iterate over playlists and if the user has the playlist defined,
			increment the size of playlists.
		*/
		for ( key in playlists ) {
			if( playlists.hasOwnProperty( key) ){
				size++;
			}
		}

		/*
			Debug how many playlists are in the config.
		*/
		privateWriteDebugMessage( 'You have '+size+' playlist(s) in your config' );

		/*
			Return the number of playlists in the config.
		*/
		return size;
	}

	/*--------------------------------------------------------------------------
		Ensures the indexes in the playlists are valid indexes. The song has
		to exist in the Amplitude config to be played correctly.
	--------------------------------------------------------------------------*/
	function privateHelpInitializeCheckValidSongsInPlaylists(){
		/*
			Iterate over all of the config's playlists
		*/
		for( key in config.playlists ){
			/*
				Checks if the playlist key is accurate.
			*/
			if( config.playlists.hasOwnProperty( key) ){
				/*
					Checks if the playlist has songs.
				*/
				if( config.playlists[key].songs ){
					/*
						Iterate over all of the songs in the playlist
					*/
					for( var i = 0; i < config.playlists[key].songs.length; i++ ){
						/*
							Check to see if the index for the song in the playlist
							exists in the songs config.
						*/
						if( !config.songs[ config.playlists[key].songs[i] ] ){
							privateWriteDebugMessage('The song index: '+config.playlists[key].songs[i]+' in playlist with key: '+key+' is not defined in your songs array!');
						}
					}
				}
			}
		}
	}

	/*--------------------------------------------------------------------------
		Initializes the shuffle statuses for each of the playlists. These will
		be referenced when we shuffle individual playlists.
	--------------------------------------------------------------------------*/
	function privateHelpInitializePlaylistShuffleStatuses(){
		/*
			Iterate over all of the playlists the user defined adding
			the playlist key to the shuffled playlist array and creating
			and empty object to house the statuses.
		*/
		for ( key in config.playlists ) {
			config.shuffled_statuses[ key ] = false;
		}
	}

	/*--------------------------------------------------------------------------
		Initializes the shuffled playlist placeholders. These will be set for
		playlists that are shuffled and contain the shuffled songs.
	--------------------------------------------------------------------------*/
	function privateHelpInitializePlaylistShuffleLists(){
		/*
			Iterate over all of the playlists the user defined adding
			the playlist key to the shuffled playlists array and creating
			and empty object to house the shuffled playlists
		*/
		for ( key in config.playlists ) {
			config.shuffled_playlists[ key ] = {};
		}
	}

	/*--------------------------------------------------------------------------
		Initializes the event handlers on all of the Amplitude JS elements.
	--------------------------------------------------------------------------*/
	function privateHelpInitializeEventHandlers(){
		/*
			Write initializtion debug message.
		*/
		privateWriteDebugMessage( 'Beginning initialization of event handlers..' );
	
		/*
			On time update for the audio element, update visual displays that
			represent the time on either a visualized element or time display.
		*/
		config.active_song.removeEventListener( 'timeupdate', privateEventUpdateTime );
		config.active_song.addEventListener( 'timeupdate', privateEventUpdateTime );

		/*
			When the audio element has ended playing, we handle the song
			ending. In a single song or multiple modular song instance,
			this just synchronizes the visuals for time and song time
			visualization, but for a playlist it determines whether
			it should play the next song or not.
		*/
		config.active_song.removeEventListener('ended', privateHandleSongEnded );
		config.active_song.addEventListener('ended', privateHandleSongEnded );

		/*
			Binds 'amplitude-play' event handlers
		*/
		privateBindPlayEventHandlers();

		/*
			Binds 'amplitude-pause' event handlers.
		*/
		privateBindPauseEventHandlers();

		/*
			Binds 'amplitude-play-pause' event handlers.
		*/
		privateBindPlayPauseEventHandlers();
		
		/*
			Binds 'amplitude-stop' event handlers.
		*/
		privateBindStopEventHandlers();

		/*
			Binds 'amplitude-mute' event handlers.
		*/
		privateBindMuteEventHandlers();
		
		/*
			Binds 'amplitude-volume-up' event handlers
		*/
		privateBindVolumeUpHandlers();
		
		/*
			Binds 'amplitude-volume-down' event handlers
		*/
		privateBindVolumeDownHandlers();
		
		/*
			Binds 'amplitude-volume-up' event handlers
		*/
		privateBindSongSliderHandlers();
		
		/*
			Binds 'amplitude-song-slider' event handlers.
		*/
		privateBindVolumeSliderHandlers();

		/*
			Binds 'amplitude-next' event handlers.
		*/
		privateBindNextHandlers();

		/*
			Binds 'amplitude-prev' event handlers.
		*/
		privateBindPrevHandlers();

		/*
			Binds 'amplitude-shuffle' event handlers.
		*/
		privateBindShuffleHandlers();

		/*
			Binds 'amplitude-repeat' event handlers.
		*/
		privateBindRepeatHandlers();
			
		/*
			Binds 'amplitude-playback-speed' event handlers.
		*/
		privateBindPlaybackSpeedHandlers();

		/*
			Binds 'amplitude-skip-to' event handlers.
		*/
		privateBindSkipToHandlers();
		
	}

	/*--------------------------------------------------------------------------
		Sets up all of the song time visualizations.  This is the only time
		that AmplitudeJS will add an element to the page. AmplitudeJS will
		add an element inside of the song time visualization element that will
		expand proportionally to the amount of time elapsed on the active 
		audio, thus visualizing the song time.  This element is NOT user
		interactive.  To have the user scrub the time, they will have to 
		style and implement a song time slider with an HTML 5 Range Element.
	--------------------------------------------------------------------------*/
	function privateHelpInitializeSongTimeVisualizations(){
		/*
			Sets up song time visualizations
		*/
		var song_time_visualizations = document.getElementsByClassName("amplitude-song-time-visualization");

		/*
			Iterates through all of the amplitude-song-time-visualization
			elements adding a new div with a class of
			'amplitude-song-time-visualization-status' that will expand
			inside of the 'amplitude-song-time-visualization' element.
		*/
		for( var i = 0; i < song_time_visualizations.length; i++ ){
			/*
				Creates new element
			*/
			var status = document.createElement('div');

			/*
				Adds class and attributes
			*/
			status.classList.add('amplitude-song-time-visualization-status');
			status.setAttribute( 'style', 'width: 0px' );

			/*
				Clears the inner HTML so we don't get two status divs.
			*/
			song_time_visualizations[i].innerHTML = '';

			/*
				Appends the element as a child element.
			*/
			song_time_visualizations[i].appendChild( status );
		}
	}
	
/*
|----------------------------------------------------------------------------------------------------
| BINDING METHODS
|----------------------------------------------------------------------------------------------------
| These methods are called when we need to bind events to certain elements.
|
| Method Prefix: privateBind
|
| METHODS:
|	privateBindPlayEventHandlers()
|	privateBindPauseEventHandlers()
|	privateBindPlayPauseEventHandlers()
|	privateBindStopEventHandlers()
|	privateBindMuteEventHandlers()
|	privateBindVolumeUpHandlers()
|	privateBindVolumeDownHandlers()
|	privateBindSongSliderHandlers()
|	privateBindVolumeSliderHandlers()
|	privateBindNextHandlers()
|	privateBindPrevHandlers()
|	privateBindShuffleHandlers()
|	privateBindRepeatHandlers()
|	privateBindPlaybackSpeedHandlers()
|	privateBindSkipToHandlers()
*/

	/*--------------------------------------------------------------------------
		BINDS: class="amplitude-play"

		Binds click and touchstart events for amplitude play buttons.
	--------------------------------------------------------------------------*/
	function privateBindPlayEventHandlers(){
		/*
			Gets all of the elements with the class amplitude-play
		*/
		var play_classes = document.getElementsByClassName("amplitude-play");

		/*
			Iterates over all of the play classes and binds the event interaction
			method to the element. If the browser is mobile, then the event is touchstart
			otherwise it is click.
		*/
		for( var i = 0; i < play_classes.length; i++ ){
			if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
				play_classes[i].removeEventListener('touchstart', privateEventPlayInteraction );
				play_classes[i].addEventListener('touchstart', privateEventPlayInteraction );
			}else{
				play_classes[i].removeEventListener('click', privateEventPlayInteraction );
				play_classes[i].addEventListener('click', privateEventPlayInteraction );
			}
		}
	}

	/*--------------------------------------------------------------------------
		BINDS: class="amplitude-pause"

		Binds click and touchstart events for amplitude pause buttons.
	--------------------------------------------------------------------------*/
	function privateBindPauseEventHandlers(){
		/*
			Gets all of the elements with the class amplitude-pause
		*/
		var pause_classes = document.getElementsByClassName("amplitude-pause");

		/*
			Iterates over all of the pause classes and binds the event interaction
			method to the element. If the browser is mobile, then the event is touchstart
			otherwise it is click.
		*/
		for( var i = 0; i < pause_classes.length; i++ ){
			if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
				pause_classes[i].removeEventListener('touchstart', privateEventPauseInteraction );
				pause_classes[i].addEventListener('touchstart', privateEventPauseInteraction );
			}else{
				pause_classes[i].removeEventListener('click', privateEventPauseInteraction );
				pause_classes[i].addEventListener('click', privateEventPauseInteraction );
			}
		}
	}

	/*--------------------------------------------------------------------------
		BINDS: class="amplitude-play-pause"
		
		Binds click and touchstart events for amplitude play pause buttons.
	--------------------------------------------------------------------------*/
	function privateBindPlayPauseEventHandlers(){
		/*
			Gets all of the elements with the class amplitude-play-pause
		*/
		var play_pause_classes = document.getElementsByClassName("amplitude-play-pause");

		/*
			Iterates over all of the play/pause classes and binds the event interaction
			method to the element. If the browser is mobile, then the event is touchstart
			otherwise it is click.
		*/
		for( var i = 0; i < play_pause_classes.length; i++ ){
			if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
				play_pause_classes[i].removeEventListener('touchstart', privateEventPlayPauseInteraction );
				play_pause_classes[i].addEventListener('touchstart', privateEventPlayPauseInteraction );
			}else{
				play_pause_classes[i].removeEventListener('click', privateEventPlayPauseInteraction );
				play_pause_classes[i].addEventListener('click', privateEventPlayPauseInteraction );
			}
		}
	}

	/*--------------------------------------------------------------------------
		BINDS: class="amplitude-stop"

		Binds click and touchstart events for amplitude stop buttons
	--------------------------------------------------------------------------*/
	function privateBindStopEventHandlers(){
		/*
			Gets all of the elements with the class amplitude-stop
		*/
		var stop_classes = document.getElementsByClassName("amplitude-stop");

		/*
			Iterates over all of the stop classes and binds the event interaction
			method to the element.  If the browser is mobile, then the event is touchstart
			otherwise it is click.
		*/
		for( var i = 0; i < stop_classes.length; i++ ){
			if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
				stop_classes[i].removeEventListener('touchstart', privateEventStopInteraction );
				stop_classes[i].addEventListener('touchstart', privateEventStopInteraction );
			}else{
				stop_classes[i].removeEventListener('click', privateEventStopInteraction );
				stop_classes[i].addEventListener('click', privateEventStopInteraction );
			}
		}
	}

	/*--------------------------------------------------------------------------
		BINDS: class="amplitude-mute"

		Binds click and touchstart events for amplitude mute buttons
	--------------------------------------------------------------------------*/
	function privateBindMuteEventHandlers(){
		/*
			Gets all of the elements with the class amplitue-mute			
		*/
		var mute_classes = document.getElementsByClassName("amplitude-mute");

		/*
			Iterates over all of the mute classes and binds the event interaction
			method to the element. If the browser is mobile, then the event is touchstart
			otherwise it is click.
		*/
		for( var i = 0; i < mute_classes.length; i++ ){
			/*
				WARNING: If iOS, we don't do anything because iOS does not allow the
				volume to be adjusted through anything except the buttons on the side of
				the device.
			*/
			if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
				/*
					Checks for an iOS device and displays an error message if debugging
					is turned on.
				*/
				if( /iPhone|iPad|iPod/i.test(navigator.userAgent) ) {
					privateWriteDebugMessage( 'iOS does NOT allow volume to be set through javascript: https://developer.apple.com/library/safari/documentation/AudioVideo/Conceptual/Using_HTML5_Audio_Video/Device-SpecificConsiderations/Device-SpecificConsiderations.html#//apple_ref/doc/uid/TP40009523-CH5-SW4' );
				}else{
					mute_classes[i].removeEventListener('touchstart', privateEventMuteInteraction );
					mute_classes[i].addEventListener('touchstart', privateEventMuteInteraction );
				}
			}else{
				mute_classes[i].removeEventListener('click', privateEventMuteInteraction );
				mute_classes[i].addEventListener('click', privateEventMuteInteraction );
			}
		}
	}

	/*--------------------------------------------------------------------------
		BINDS: class="amplitude-volume-up"

		Binds click and touchstart events for amplitude volume up buttons
	--------------------------------------------------------------------------*/
	function privateBindVolumeUpHandlers(){
		/*
			Gets all of the elements with the class amplitude-volume-up			
		*/
		var volume_up_classes = document.getElementsByClassName("amplitude-volume-up");

		/*
			Iterates over all of the volume up classes and binds the event interaction
			methods to the element. If the browser is mobile, then the event is touchstart
			otherwise it is click.
		*/
		for( var i = 0; i < volume_up_classes.length; i++ ){
			/*
				WARNING: If iOS, we don't do anything because iOS does not allow the
				volume to be adjusted through anything except the buttons on the side of
				the device.
			*/
			if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
				/*
					Checks for an iOS device and displays an error message if debugging
					is turned on.
				*/
				if( /iPhone|iPad|iPod/i.test(navigator.userAgent) ) {
					privateWriteDebugMessage( 'iOS does NOT allow volume to be set through javascript: https://developer.apple.com/library/safari/documentation/AudioVideo/Conceptual/Using_HTML5_Audio_Video/Device-SpecificConsiderations/Device-SpecificConsiderations.html#//apple_ref/doc/uid/TP40009523-CH5-SW4' );
				}else{
					volume_up_classes[i].removeEventListener('touchstart', privateEventVolumeUpInteraction );
					volume_up_classes[i].addEventListener('touchstart', privateEventVolumeUpInteraction );
				}
			}else{
				volume_up_classes[i].removeEventListener('click', privateEventVolumeUpInteraction );
				volume_up_classes[i].addEventListener('click', privateEventVolumeUpInteraction );
			}
		}
	}

	/*--------------------------------------------------------------------------
		BINDS: class="amplitude-volume-down"

		Binds click and touchstart events for amplitude volume down buttons
	--------------------------------------------------------------------------*/
	function privateBindVolumeDownHandlers(){
		/*
			Gets all of the elements with the class amplitude-volume-down			
		*/
		var volume_down_classes = document.getElementsByClassName("amplitude-volume-down");
		
		/*
			Iterates over all of the volume down classes and binds the event interaction
			methods to the element. If the browser is mobile, then the event is touchstart
			otherwise it is click.
		*/
		for( var i = 0; i < volume_down_classes.length; i++ ){
			/*
				WARNING: If iOS, we don't do anything because iOS does not allow the
				volume to be adjusted through anything except the buttons on the side of
				the device.
			*/
			if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
				/*
					Checks for an iOS device and displays an error message if debugging
					is turned on.
				*/
				if( /iPhone|iPad|iPod/i.test(navigator.userAgent) ) {
					privateWriteDebugMessage( 'iOS does NOT allow volume to be set through javascript: https://developer.apple.com/library/safari/documentation/AudioVideo/Conceptual/Using_HTML5_Audio_Video/Device-SpecificConsiderations/Device-SpecificConsiderations.html#//apple_ref/doc/uid/TP40009523-CH5-SW4' );
				}else{
					volume_down_classes[i].removeEventListener('touchstart', privateEventVolumeDownInteraction );
					volume_down_classes[i].addEventListener('touchstart', privateEventVolumeDownInteraction );
				}
			}else{
				volume_down_classes[i].removeEventListener('click', privateEventVolumeDownInteraction );
				volume_down_classes[i].addEventListener('click', privateEventVolumeDownInteraction );
			}
		}
	}

	/*--------------------------------------------------------------------------
		BINDS: class="amplitude-song-slider"

		Binds change and input events for amplitude song slider inputs
	--------------------------------------------------------------------------*/
	function privateBindSongSliderHandlers(){
		/*
			Gets browser so if we need to apply overrides, like we usually
			have to do for anything cool in IE, we can do that.
		*/
		var ua 		= window.navigator.userAgent;
        var msie 	= ua.indexOf("MSIE ");

		/*
			Gets all of the elements with the class amplitude-song-slider
		*/
		var song_sliders = document.getElementsByClassName("amplitude-song-slider");

		/*
			Iterates over all of the song slider classes and binds the event interaction
			methods to the element. If the browser is IE we listen to the change event
			where if it is anything else, it's the input method.
		*/
		for( var i = 0; i < song_sliders.length; i++ ){
			if ( msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./) ){
				song_sliders[i].removeEventListener('change', privateEventSongSliderInteraction );
				song_sliders[i].addEventListener('change', privateEventSongSliderInteraction );
			}else{
				song_sliders[i].removeEventListener('input', privateEventSongSliderInteraction );
				song_sliders[i].addEventListener('input', privateEventSongSliderInteraction );
			}
		}
	}

	/*--------------------------------------------------------------------------
		BINDS: class="amplitude-volume-slider"

		Binds change and input events for amplitude volume slider inputs
	--------------------------------------------------------------------------*/
	function privateBindVolumeSliderHandlers(){
		/*
			Gets browser so if we need to apply overrides, like we usually
			have to do for anything cool in IE, we can do that.
		*/
		var ua 		= window.navigator.userAgent;
        var msie 	= ua.indexOf("MSIE ");

        /*
			Gets all of the elements with the class amplitude-volume-slider
        */
		var volume_sliders = document.getElementsByClassName("amplitude-volume-slider");

		/*
			Iterates over all of the volume slider classes and binds the event interaction
			methods to the element. If the browser is IE we listen to the change event
			where if it is anything else, it's the input method.
		*/
		for( var i = 0; i < volume_sliders.length; i++ ){
			/*
				WARNING: If iOS, we don't do anything because iOS does not allow the
				volume to be adjusted through anything except the buttons on the side of
				the device.
			*/
			if( /iPhone|iPad|iPod/i.test(navigator.userAgent) ) {
				privateWriteDebugMessage( 'iOS does NOT allow volume to be set through javascript: https://developer.apple.com/library/safari/documentation/AudioVideo/Conceptual/Using_HTML5_Audio_Video/Device-SpecificConsiderations/Device-SpecificConsiderations.html#//apple_ref/doc/uid/TP40009523-CH5-SW4' );
			}else{
				if ( msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./) ){
					volume_sliders[i].removeEventListener('change', privateEventVolumeSliderInteraction );
					volume_sliders[i].addEventListener('change', privateEventVolumeSliderInteraction );
				}else{
					volume_sliders[i].removeEventListener('input', privateEventVolumeSliderInteraction );
					volume_sliders[i].addEventListener('input', privateEventVolumeSliderInteraction );
				}
			}
		}
	}

	/*--------------------------------------------------------------------------
		BINDS: class="amplitude-next"

		Binds click and touchstart events for amplitude next buttons.
	--------------------------------------------------------------------------*/
	function privateBindNextHandlers(){
		/*
			Gets all of the elements with the class amplitude-next
        */
		var next_classes = document.getElementsByClassName("amplitude-next");

		/*
			Iterates over all of the next classes and binds the event interaction
			methods to the element. If the browser is mobile, then the event is touchstart
			otherwise it is click.
		*/
		for( var i = 0; i < next_classes.length; i++ ){
			if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
				next_classes[i].removeEventListener('touchstart', privateEventNextInteraction );
				next_classes[i].addEventListener('touchstart', privateEventNextInteraction );
			}else{
				next_classes[i].removeEventListener('click', privateEventNextInteraction );
				next_classes[i].addEventListener('click', privateEventNextInteraction );
			}
		}
	}

	/*--------------------------------------------------------------------------
		BINDS: class="amplitude-prev"

		Binds click and touchstart events for amplitude prev buttons.
	--------------------------------------------------------------------------*/
	function privateBindPrevHandlers(){
		/*
			Gets all of the elements with the class amplitude-prev
		*/
		var prev_classes = document.getElementsByClassName("amplitude-prev");

		/*
			Iterates over all of the prev classes and binds the event interaction
			methods to the element. If the browser is mobile, then the event is touchstart
			otherwise it is click.
		*/
		for( var i = 0; i < prev_classes.length; i++ ){
			if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
				prev_classes[i].removeEventListener('touchstart', privateEventPrevInteraction );
				prev_classes[i].addEventListener('touchstart', privateEventPrevInteraction );
			}else{
				prev_classes[i].removeEventListener('click', privateEventPrevInteraction );
				prev_classes[i].addEventListener('click', privateEventPrevInteraction );
			}
		}
	}

	/*--------------------------------------------------------------------------
		BINDS: class="amplitude-shuffle"

		Binds click and touchstart events for amplitude shuffle buttons.
	--------------------------------------------------------------------------*/
	function privateBindShuffleHandlers(){
		/*
			Gets all of the elements with the class amplitude-shuffle
		*/
		var shuffle_classes = document.getElementsByClassName("amplitude-shuffle");

		/*
			Iterates over all of the shuffle classes and binds the event interaction
			methods to the element. If the browser is mobile, then the event is touchstart
			otherwise it is click.
		*/
		for( var i = 0; i < shuffle_classes.length; i++ ){
			/*
				Since we are re-binding everything we remove any classes that signify 
				a state of the shuffle control.
			*/
			shuffle_classes[i].classList.remove('amplitude-shuffle-on');
			shuffle_classes[i].classList.add('amplitude-shuffle-off');

			if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
				shuffle_classes[i].removeEventListener('touchstart', privateEventShuffleInteraction );
				shuffle_classes[i].addEventListener('touchstart', privateEventShuffleInteraction );
			}else{
				shuffle_classes[i].removeEventListener('click', privateEventShuffleInteraction );
				shuffle_classes[i].addEventListener('click', privateEventShuffleInteraction );
			}
		}
	}

	/*--------------------------------------------------------------------------
		BINDS: class="amplitude-repeat"

		Binds click and touchstart events for amplitude repeat buttons.
	--------------------------------------------------------------------------*/
	function privateBindRepeatHandlers(){
		/*
			Gets all of the elements with the class amplitude-repeat
		*/
		var repeat_classes = document.getElementsByClassName("amplitude-repeat");

		/*
			Iterates over all of the repeat classes and binds the event interaction
			methods to the element. If the browser is mobile, then the event is touchstart
			otherwise it is click.
		*/
		for( var i = 0; i < repeat_classes.length; i++ ){
			/*
				Since we are re-binding everything we remove any classes that signify 
				a state of the repeat control.
			*/
			repeat_classes[i].classList.remove('amplitude-repeat-on');
			repeat_classes[i].classList.add('amplitude-repeat-off');

			if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
				repeat_classes[i].removeEventListener('touchstart', privateEventRepeatInteraction );
				repeat_classes[i].addEventListener('touchstart', privateEventRepeatInteraction );
			}else{
				repeat_classes[i].removeEventListener('click', privateEventRepeatInteraction );
				repeat_classes[i].addEventListener('click', privateEventRepeatInteraction );
			}
		}
	}

	/*--------------------------------------------------------------------------
		BINDS: class="amplitude-playback-speed"

		Binds click and touchstart events for amplitude playback speed buttons.

		TODO: Remove classes that represent different speeds.
	--------------------------------------------------------------------------*/
	function privateBindPlaybackSpeedHandlers(){
		/*
			Gets all of the elements with the class amplitude-playback-speed
		*/
		var playback_speed_classes = document.getElementsByClassName("amplitude-playback-speed");

		/*
			Iterates over all of the playback speed classes and binds the event interaction
			methods to the element. If the browser is mobile, then the event is touchstart
			otherwise it is click.
		*/
		for( var i = 0; i < playback_speed_classes.length; i++ ){
			if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
				playback_speed_classes[i].removeEventListener('touchstart', privateEventPlaybackSpeedInteraction );
				playback_speed_classes[i].addEventListener('touchstart', privateEventPlaybackSpeedInteraction );
			}else{
				playback_speed_classes[i].removeEventListener('click', privateEventPlaybackSpeedInteraction );
				playback_speed_classes[i].addEventListener('click', privateEventPlaybackSpeedInteraction );
			}
		}
	}

	/*--------------------------------------------------------------------------
		BINDS: class="amplitude-skip-to"

		Binds click and touchstart events for amplitude skip to buttons.

		TODO: Add a way to skip to any song with this button. Should have a
		song index and a time location.
	--------------------------------------------------------------------------*/
	function privateBindSkipToHandlers(){

	}

/*
|----------------------------------------------------------------------------------------------------
| EVENT HANDLER FUNCTIONS
|----------------------------------------------------------------------------------------------------
| These functions handle the events that we bound to each element and
| prepare for a function to be called. These kind of act like filters/middleware.
|
| Method Prefix: privateEvent
|
| METHODS
|	privateEventUpdateTime()
|	privateEventPlayInteraction()
|	privateEventPauseInteraction()
|	privateEventPlayPauseInteraction()
|	privateEventStopInteraction()
|	privateEventMuteInteraction()
|	privateEventVolumeUpInteraction()
|	privateEventVolumeDownInteraction()
|	privateEventSongSliderInteraction()
|	privateEventVolumeSliderInteraction()
|	privateEventNextInteraction()
|	privateEventPrevInteraction()
|	privateEventShuffleInteraction()
|	privateEventRepeatInteraction()
|	privateEventPlaybackSpeedInteraction()
|	privateEventSkipToInteraction()
*/
	/*--------------------------------------------------------------------------
		Handles an update on the current song's time.
	--------------------------------------------------------------------------*/
	function privateEventUpdateTime(){
		/*
			If the current song is not live, then
			we can update the time information. Otherwise the
			current time updates wouldn't mean much since the time
			is infinite.
		*/
		if( !config.active_metadata.live ){
			/*
				Compute the current time
			*/
			var currentTime = privateEventHelperComputeCurrentTimes();

			/*
				Compute the song completion percentage
			*/
			var songCompletionPercentage = privateEventHelperComputeSongCompletionPercentage();

			/*
				Sync the current time elements with the current
				location of the song.
			*/
			privateVisualSyncCurrentTime( currentTime, songCompletionPercentage );
		}
	}

	/*--------------------------------------------------------------------------
		Handles an event on a play button.
	--------------------------------------------------------------------------*/
	function privateEventPlayInteraction(){
		/*
			Gets the attribute for song index so we can check if
			there is a need to change the song.  In some scenarios
			there might be multiple play classes on the page. In that
			case it is possible the user could click a different play
			class and change the song.
		*/
		var playButtonSongIndex = this.getAttribute('amplitude-song-index');

		/*
			We set the new song if the user clicked a song with a different
			index. If it's the same as what's playing then we don't set anything. 
			If it's different we reset all song sliders.
		*/
		if( privateCheckNewSong( playButtonSongIndex ) ){
			/*
				Changes the song which updates the display elements
				and prepares it to be played.
			*/
			privateEventHelperChangeSong( config.songs[ playButtonSongIndex ] );
		}

		// If there is a new song, it is set so we can continue playing.
		// TODO: We should method this out so we can use it in the play/pause interaction

		/*
			Start the visualizations for the song.
		*/
		privateStartVisualization();
		
		/*
			Play the song through the core play function.
		*/
		privateCorePlay();
	}

	function privateEventPauseInteraction(){

	}

	function privateEventPlayPauseInteraction(){

	}

	function privateEventStopInteraction(){

	}

	function privateEventMuteInteraction(){

	}

	function privateEventVolumeUpInteraction(){

	}

	function privateEventVolumeDownInteraction(){

	}

	function privateEventSongSliderInteraction(){

	}

	function privateEventVolumeSliderInteraction(){

	}

	function privateEventNextInteraction(){

	}

	function privateEventPrevInteraction(){

	}

	function privateEventShuffleInteraction(){

	}

	function privateEventRepeatInteraction(){

	}

	function privateEventPlaybackSpeedInteraction(){

	}

	function privateEventSkipToInteraction(){

	}

/*
|----------------------------------------------------------------------------------------------------
| EVENT HANDLER HELPER METHODS
|----------------------------------------------------------------------------------------------------
| These methods help handle interactions whether it's computation or shuffling songs.
|
| Method Prefix: privateEventHelper
|
| METHODS
|	privateEventHelperComputeCurrentTimes()
|	privateEventHelperComputeSongDuration()
|	privateEventHelperComputeSongCompletionPercentage()
*/
	/*--------------------------------------------------------------------------
		Computes the current song time. Breaks down where the song is into
		hours, minutes, seconds and formats it to be displayed to the user.
	--------------------------------------------------------------------------*/
	function privateEventHelperComputeCurrentTimes(){
		/*
			Initialize the current time object that will be returned.
		*/
		var currentTime = {};

		/*
			Computes the current seconds for the song.
		*/
		var currentSeconds = ( Math.floor( config.active_song.currentTime % 60 ) < 10 ? '0' : '' ) + 
							    Math.floor( config.active_song.currentTime % 60 );

		/*
			Computes the current minutes for the song.
		*/
		var currentMinutes = Math.floor( config.active_song.currentTime / 60 );

		/*
			Initialize the current hours variable.
		*/
		var currentHours = '00';

		/*
			If the current minutes is less than 10, we add a leading 0.
		*/
		if( currentMinutes < 10 ){
			currentMinutes = '0'+currentMinutes;
		}

		/*
			If the user is more than 60 minutes into the song, then
			we extract the hours.
		*/
		if( currentMinutes > 60 ){
			currentHours 		= Math.floor( currentMinutes / 60 );
			currentMinutes 		= currentMinutes % 60;

			/*
				If the user is less than 10 hours in, we append the
				additional 0 to the hours.
			*/
			if( currentHours < 10 ){
				currentHours = '0'+currentHours;
			}

			/*
				If the user is less than 10 minutes in, we append the
				additional 0 to the minutes.
			*/
			if( currentMinutes < 10 ){
				currentMinutes = '0'+currentMinutes;
			}
		}

		/*
			Build a clean current time object and send back the appropriate information.
		*/
		currentTime.seconds = currentSeconds;
		currentTime.minutes = currentMinutes;
		currentTime.hours 	= currentHours;

		return currentTime;
	}

	/*--------------------------------------------------------------------------
		Computes the current song duration. Breaks down where the song is into
		hours, minutes, seconds and formats it to be displayed to the user.
	--------------------------------------------------------------------------*/
	function privateEventHelperComputeSongDuration(){
		/*
			Initialize the song duration object that will be returned.
		*/
		var songDuration = {};

		/*
			Computes the duration of the song's seconds.
		*/
		var songDurationSeconds = ( Math.floor( config.active_song.duration % 60 ) < 10 ? '0' : '' ) + 
									  		Math.floor( config.active_song.duration % 60 );

		/*
			Computes the duration of the song's minutes.
		*/
		var songDurationMinutes = Math.floor( config.active_song.duration / 60 );

		/*
			Initialize the hours duration variable.
		*/
		var songDurationHours = '00';

		/*
			If the song duration minutes is less than 10, we add a leading 0.
		*/
		if( songDurationMinutes < 10 ){
			songDurationMinutes = '0'+songDurationMinutes;
		}
		
		/*
			If there is more than 60 minutes in the song, then we
			extract the hours.
		*/
		if( songDurationMinutes > 60 ){
			songDurationHours 		= Math.floor( songDurationMinutes / 60 ); 
			songDurationMinutes 	= songDurationMinutes % 60;

			/*
				If the song duration hours is less than 10 we append
				the additional 0.
			*/
			if( songDurationHours < 10 ){
				songDurationHours = '0'+songDurationHours;
			}

			/*
				If the song duration minutes is less than 10 we append
				the additional 0.
			*/
			if( songDurationMinutes < 10 ){
				songDurationMinutes = '0'+songDurationMinutes;
			}
		}

		/*
			Build a clean song duration object and send back the appropriate information.
		*/
		songDuration.seconds 	= songDurationSeconds;
		songDuration.minutes 	= songDurationMinutes;
		songDuration.hours 		= songDurationHours;

		return songDuration;
	}

	/*--------------------------------------------------------------------------
		Computes the song completion percentage.
	--------------------------------------------------------------------------*/
	function privateEventHelperComputeSongCompletionPercentage(){
		return ( config.active_song.currentTime / config.active_song.duration ) * 100;
	}

	/*--------------------------------------------------------------------------
		Checks to see if the new song to be played is different than the song
		that is currently playing. To be true, the user would have selected
		play on a new song with a new index. To be false, the user would have
		clicked play/pause on the song that was playing.

		@param int songIndex The index of the new song to be played.
	--------------------------------------------------------------------------*/
	function privateEventHelperCheckNewSong( songIndex ){
		if( songIndex != config.active_index ){
			return true;
		}else{
			return false;
		}
	}

	function privateEventHelperChangeSong( song ){
		/*
			Stops the currently playing song so we can adjust
			what we need.
		*/
		privateStop();


		/* ADJUST CONFIG */
		/* DO META AND OTHER VISUAL SYNCS */

		/*
			
		*/

		/*
			Since it is a new song, we reset the song sliders. These
			react to time updates and will eventually be updated but we
			force update them is if there is a song slider bound to a
			specific song, they won't update.
		*/
		privateVisualSyncResetSongSliders();

		/*
			Reset the song time vizualizations as well since those
			can be bound to a specific song.
		*/
		privateVisualSyncResetSongTimeVisualizations();
	}

/*
|----------------------------------------------------------------------------------------------------
| VISUAL SYNC METHODS
|----------------------------------------------------------------------------------------------------
| These methods sync visual displays with what is happening in Amplitude
|
| Method Prefix: privateVisualSync
|
| METHODS
|	privateVisualSyncCurrentTime( currentTime, completionPercentage )
*/
	/*--------------------------------------------------------------------------
		Visually displays the current time on the screen. This is called on
		time update for the current song.

		@param JSON currentTime An object containing the current time for the
		song in seconds, minutes, and hours.

		@param float completionPercentage The percent of the way through the song
		the user is at.
	--------------------------------------------------------------------------*/
	function privateVisualSyncCurrentTime( currentTime, completionPercentage ){
		/*
			Set current hour display.
		*/
		privateVisualSyncHelperCurrentHours( currentTime.hours );

		/*
			Set current minute display.
		*/
		privateVisualSyncHelperCurrentMinutes( currentTime.minutes );

		/*
			Set current second display.
		*/
		privateVisualSyncHelperCurrentSeconds( currentTime.seconds );

		/*
			Set current time display.
		*/
		privateVisualSyncHelperCurrentTime( currentTime );

		/*
			Set all song sliders to be to the current percentage
			of the song played.
		*/
		privateVisualSyncHelperSongSliders( completionPercentage );

		/*
			Set all visual sync song time visualizations. This will
			expand the div inside of the visualization to be the song
			played percentage.
		*/
		privateVisualSyncSongTimeVisualizations( songPlayedPercentage );
	}

	function privateVisualSyncResetSongSliders(){
		var songSliders = document.getElementsByClassName("amplitude-song-slider");

		/*
			Iterate over all of the song sliders and set them to
			0 essentially resetting them.
		*/
		for( var i = 0; i < songSliders.length; i++ ){
			songSliders[i].value = 0;
		}
	}

	function privateVisualSyncResetSongTimeVisualizations(){
		var songTimeVisualizations = document.getElementsByClassName("amplitude-song-time-visualization");

		for( var i = 0; i < songTimeVisualizations.length; i++ ){
			var songTimeVisualizationStatus = songTimeVisualizations[i].querySelectorAll('.amplitude-song-time-visualization-status');
			songTimeVisualizationStatus[i].setAttribute('style', 'width: 0px');
		}
	}

/*
|----------------------------------------------------------------------------------------------------
| VISUAL SYNC HELPER METHODS
|----------------------------------------------------------------------------------------------------
| These methods help sync visual displays. They essentially make the visual sync methods
| smaller and more maintainable.
|
| Method Prefix: privateVisualSyncHelper
|
| METHODS
|	privateVisualSyncHelperCurrentHours( hours )
|	privateVisualSyncHelperCurrentMinutes( minutes )
|	privateVisualSyncHelperCurrentSeconds( seconds )
|	privateVisualSyncHelperCurrentTime( currentTime )
|	privateVisualSyncSongSliders( songPlayedPercentage )
|	privateVisualSyncSongTimeVisualizations( songPlayedPercentage )
*/
	/*--------------------------------------------------------------------------
		Updates any elements that display the current hour for the song.

		@param int hours An integer conaining how many hours into
		the song.
	--------------------------------------------------------------------------*/
	function privateVisualSyncHelperCurrentHours( hours ){
		/*
			Gets all of the song hour selectors.
		*/
		var hourSelectors = [
			'.amplitude-current-hours[amplitude-main-current-hours="true"]',
			'.amplitude-current-hours[amplitude-playlist-main-current-hours="'+config.active_playlist+'"]',
			'.amplitude-current-hours[amplitude-song-index="'+config.active_index+'"]'
		];

		/*
			Ensures that there are some hour selectors.
		*/
		if( document.querySelectorAll( hourSelectors.join() ).length > 0 ){
			/*
				Get all of the hour selectors
			*/
			var currentHourSelectors = document.querySelectorAll( hourSelectors.join() );
			
			/*
				Set the current hour selector's inner html to hours passed in.
			*/
			for( var i = 0; i < currentHourSelectors.length; i++ ){
				currentHourSelectors[i].innerHTML = hours;
			}
		}
	}

	/*--------------------------------------------------------------------------
		Updates any elements that display the current minutes for the song.

		@param int minutes An integer conaining how many minutes into
		the song.
	--------------------------------------------------------------------------*/
	function privateVisualSyncHelperCurrentMinutes( minutes ){
		/*
			Gets all of the song minute selectors.
		*/
		var minuteSelectors = [
			'.amplitude-current-minutes[amplitude-main-current-minutes="true"]',
			'.amplitude-current-minutes[amplitude-playlist-main-current-minutes="'+config.active_playlist+'"]',
			'.amplitude-current-minutes[amplitude-song-index="'+config.active_index+'"]'
		];

		/*
			Ensures that there are some minute selectors.
		*/
		if( document.querySelectorAll( minuteSelectors.join() ).length > 0 ){
			/*
				Get all of the minute selectors
			*/
			var currentMinuteSelectors = document.querySelectorAll( minuteSelectors.join() );

			/*
				Set the current minute selector's inner html to minutes passed in.
			*/
			for( var i = 0; i < currentMinuteSelectors.length; i++ ){
				currentMinuteSelectors[i].innerHTML = minutes;
			}
		}
	}

	/*--------------------------------------------------------------------------
		Updates any elements that display the current seconds for the song.

		@param int minutes An integer conaining how many seconds into
		the song.
	--------------------------------------------------------------------------*/
	function privateVisualSyncHelperCurrentSeconds( seconds ){
		/*
			Gets all of the song second selectors.
		*/
		var secondSelectors = [
			'.amplitude-current-seconds[amplitude-main-current-seconds="true"]',
			'.amplitude-current-seconds[amplitude-playlist-main-current-seconds="'+config.active_playlist+'"]',
			'.amplitude-current-seconds[amplitude-song-index="'+config.active_index+'"]'
		];

		/*
			Ensures that there are some second selectors.
		*/
		if( document.querySelectorAll( secondSelectors.join() ).length > 0 ){
			/*
				Get all of the second selectors
			*/
			var currentSecondSelectors = document.querySelectorAll( secondSelectors.join() );

			/*
				Set the current second selector's inner html to seconds passed in.
			*/
			for( var i = 0; i < currentSecondSelectors.length; i++ ){
				currentSecondSelectors[i].innerHTML = seconds;
			}
		}
	}

	/*--------------------------------------------------------------------------
		Updates any elements that display the current time for the song. This
		is a computed field that will be commonly used.

		@param JSON currentTime A json object conaining the parts for the
		current time for the song.
	--------------------------------------------------------------------------*/
	function privateVisualSyncHelperCurrentTime( currentTime ){
		/*
			Gets all of the song time selectors.
		*/
		var timeSelectors = [
			'.amplitude-current-time[amplitude-main-current-time="true"]',
			'.amplitude-current-time[amplitude-playlist-main-current-time="'+config.active_playlist+'"]',
			'.amplitude-current-time[amplitude-song-index="'+config.active_index+'"]'
		];

		/*
			Ensures that there are some time selectors.
		*/
		if( document.querySelectorAll( timeSelectors.join() ).length > 0 ){
			/*
				Get all of the time selectors.
			*/
			var currentTimeSelectors = document.querySelectorAll( timeSelectors.join() );

			/*
				Set the time selector's inner html to the current time for the song. The current
				time is computed by joining minutes and seconds.
			*/
			for( var i = 0; i < currentTimeSelectors.length; i++ ){
				currentTimeSelectors[i].innerHTML = currentTime.minutes+':'+currentTime.seconds;
			}
		}
	}

	/*--------------------------------------------------------------------------
		Updates all of the song sliders which are the range inputs the
		user can interact with.

		@param float songPlayedPercentage The percentage of the song that
		has been played.
	--------------------------------------------------------------------------*/
	function privateVisualSyncSongSliders( songPlayedPercentage ){
		/*
			Gets all of the song sliders
		*/
		var songSliders = [
			'[amplitude-singular-song-slider="true"]',
			'input[amplitude-song-index="'+config.active_index+'"]'
		];

		/*
			Ensures that there are song sliders.
		*/
		if( document.querySelectorAll( songSliders.join() ).length > 0 ){
			/*
				Get all of the song sliders
			*/
			var songSliders = document.querySelectorAll( songSliders.join() );
			
			/*
				Iterate over the song time sliders and set their value
				the song played percentage.
			*/
			for( var i = 0; i < currentTimeSelectors.length; i++ ){
				songSliders[i].value = songPlayedPercentage;
			}
		}
	}

	/*--------------------------------------------------------------------------
		Updates all of the song time visualizaitons which are an expanding
		element that displays the percentage of the song that has been played.

		@param float songPlayedPercentage The percentage of the song that
		has been played.
	--------------------------------------------------------------------------*/
	function privateVisualSyncSongTimeVisualizations( songPlayedPercentage ){
		/*
			Gets all of the song time visualizations.
		*/
		var songTimeVisualizations = [
			'[amplitude-main-song-time-visualization="true"]',
			'.amplitude-song-time-visualization[amplitude-song-index="'+config.active_index+'"]'
		];

		/*
			Ensures that there are song time visualizations.
		*/
		if( document.querySelectorAll( songTimeVisualizations.join() ).length > 0 ){
			/*
				Get all of the song time visualizations.
			*/
			var songTimeVisualizations = document.querySelectorAll( songTimeVisualizations.join() );

			/*
				Iterate over the song time visualizations, compute the width of the inner
				element that displays the percentage of the song played.
			*/
			for( var i = 0; i < songTimeVisualizations.length; i++ ){
				var songTimeVisualizationStatus = songTimeVisualizations[i].querySelectorAll('.amplitude-song-time-visualization-status');
				var visualizationWidth 			= songTimeVisualizations[i].offsetWidth;
				var computedWidth 				= ( visualizationWidth * ( songPlayedPercentage / 100 ) );

				/*
					Set the inner element width to the computed width. This allows for the user
					to define the width of the outer element and this will fill proportionally.
				*/
				songTimeVisualizationStatus[0].setAttribute('style', 'width: ' + computedWidth + 'px');
			}
		}
	}

/*
|----------------------------------------------------------------------------------------------------
| CORE FUNCTIONAL METHODS
|----------------------------------------------------------------------------------------------------
| Interacts directly with native functions of the Audio element. Logic
| leading up to these methods are handled by click handlers which call
| helpers and visual synchronizers. These are the core functions of AmplitudeJS.
| Every other function that leads to these prepare the information to be 
| acted upon by these functions.
|
| Method Prefix: privateCore
|
| METHODS
|	privateCorePlay()
|	privateCorePause()
|	privateCoreStop()
|	privateCoreSetVolume( volumeLevel )
|	privateCoreSetSongLocation( songPercentage )
|	privateCoreDisconnectStream()
|	privateCoreReconnectStream()
*/

	/*--------------------------------------------------------------------------
		Plays the active song. If the current song is live, it reconnects
		the stream before playing.
	--------------------------------------------------------------------------*/
	function privateCorePlay(){
		privateRunCallback('before_play');

		if( config.active_metadata.live ){
			privateCoreReconnectStream();
		}

		/*
			Mobile remote sources need to be reconnected on play. I think this is
			because mobile browsers are optimized not to load all resources
			for speed reasons. We only do this if mobile and the paused button
			is not clicked. If the pause button was clicked then we don't reconnect
			or the user will lose their place in the stream.
		*/
		if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && !config.paused ) {
			privateReconnectStream();
		}

		config.active_song.play();
		config.active_song.playbackRate = config.playback_speed;
		
		privateRunCallback('after_play');
	}

	/*--------------------------------------------------------------------------
		Pauses the active song. If it's live, it disconnects the stream.
	--------------------------------------------------------------------------*/
	function privateCorePause(){
		config.active_song.pause();
		
		/*
			Flag that pause button was clicked.
		*/
		config.paused = true;

		if( config.active_metadata.live ){
			privateCoreDisconnectStream();
		}
	}

	/*--------------------------------------------------------------------------
		Stops the active song by setting the current song time to 0.
		When the user resumes, it will be from the beginning.
		If it's a live stream it disconnects.
	--------------------------------------------------------------------------*/
	function privateCoreStop(){
		privateRunCallback('before_stop');

		config.active_song.currentTime = 0;
		config.active_song.pause();

		if( config.active_metadata.live ){
			privateCoreDisconnectStream();
		}

		privateRunCallback('after_stop');
	}

	/*--------------------------------------------------------------------------
		Sets the song volume.

		@param int volumeLevel A number between 1 and 100 as a percentage of
		min to max for a volume level.
	--------------------------------------------------------------------------*/
	function privateCoreSetVolume( volumeLevel ){
		config.active_song.volume = volumeLevel / 100;
	}

	/*--------------------------------------------------------------------------
		Sets the song percentage. If it's a live song, we ignore this because
		we can't skip ahead. This is an issue if you have a playlist with 
		a live source.

		@param int songPercentage A number between 1 and 100 as a percentage of
		song completion.
	--------------------------------------------------------------------------*/
	function privateCoreSetSongLocation( songPercentage ){
		if( !config.active_metadata.live ){
			config.active_song.currentTime = ( config.active_song.duration ) * ( song_percentage / 100 );
		}
	}

	/*--------------------------------------------------------------------------
		Disconnects the live stream
	--------------------------------------------------------------------------*/
	function privateCoreDisconnectStream(){
		config.active_song.src = '';
		config.active_song.load();
	}

	/*--------------------------------------------------------------------------
		Reconnects the live stream
	--------------------------------------------------------------------------*/
	function privateCoreReconnectStream(){
		config.active_song.src = config.active_metadata.url;
		config.active_song.load();
	}

	/**************


	TODO: Move all methods below for interactions into the new
	methods above so the prefix is standardized


	***************/


	/*--------------------------------------------------------------------------
		HANDLER FOR: 'amplitude-pause'

		Handles a click on a pause element.

		TODO: Check to see that the pause element has an index and if that
		index matches the current song being played.  If it's different then
		we should disable it? If the user clicks on song-index=1 pause and 
		song-index=2 is being played, is it right to pause?
	--------------------------------------------------------------------------*/
	function privatePauseClickHandle(){
		/*
			Calls the core function for pause
		*/
		privatePause();
	}

	/*--------------------------------------------------------------------------
		HANDLER FOR: class="amplitude-play-pause"
		
		AVAILABLE ATTRIBUTES: 
			amplitude-song-index
			amplitude-main-play-pause
			amplitude-playlist-main-play-pause
			amplitude-playlist

		Handles a click on a play/pause element.  This element toggles
		functionality based on the state of the song.

		TODO: Clean up this function and break out into helper functions
	--------------------------------------------------------------------------*/
	function privateEventPlayPauseInteraction(){
		/*
			Checks to see if the play pause button has the attribute amplitude-main-play-pause
			which means it reacts to the current status of AmplitudeJS.
		*/
		var isGlobalPlayPause 	= this.getAttribute('amplitude-main-play-pause');
		
		/*
			Initialize the variable to false for checking if the song being played is
			a new song.
		*/
		var isNewSong = false;
		
		/*
			Initialize the placeholders which will define what our new indexes and playlists
			are.
		*/
		var newSongIndex = '';
		var newPlayingPlaylist = '';

		/*
			If the interaction was with a play pause button that is not a global play pause,
			then we check for what kind of play pause button it is.
		*/
		if( !isGlobalPlayPause ){
			
			/*
				Checks to see if the interaction was with a play pause for a playlist.
			*/
			var playlistPlayPause 			= this.getAttribute('amplitude-playlist-main-play-pause');

			/*
				If the interaction was with a play pause button for a playlist that is 
				different than what is already playing, then it is definitely a new song, 
				and there is a new playlist. Otherwise we get the song index for the play
				pause button and the playlist defined. We then check to see if it is a new
				song because it could be the same song in the same playlist, just interacting
				on the song level instead of the playlist level.
			*/
			if( playlistPlayPause && ( playlistPlayPause != config.active_playlist ) ){
				isNewSong = true;

				newPlayingPlaylist 		= playlistPlayPause;
				newSongIndex 			= privateGetSongAtPlaylistPosition( 0, newPlayingPlaylist );
			}else{
				newPlayingPlaylist 		= this.getAttribute('amplitude-playlist');
				newSongIndex 			= this.getAttribute('amplitude-song-index');
				
				isNewSong = privateCheckNewSong( newSongIndex, newPlayingPlaylist );
			}
		}

		if( isNewSong ){
			var newSong = privateGetSongAtIndex( newSongIndex );
			
			config.active_index = newSongIndex;

	//		privateChangeSong( newSong );

			privateSetActivePlaylist( newPlayingPlaylist );
	
	//		privateAfterSongChanges();
		}else{
			if( config.active_song.paused ){
				
				privateChangePlayPauseState('playing');

				/*
					Starts the song visualization if there is one.
				*/
				privateStartVisualization();

				privateCorePlay( this.getAttribute('amplitude-song-index') );
			}else{
				privateChangePlayPauseState('paused');

				privatePause();
			}
		}

	}

	

	/*--------------------------------------------------------------------------
		HANDLER FOR: 'amplitude-stop'

		Handles a click on a stop element.
	--------------------------------------------------------------------------*/
	function privateStopClickHandle(){
		/*
			Calls the helper function to stop
			the visualization.
		*/
		privateStopVisualization();

		/*
			Calls the core function for stop
		*/
		privateStop();
	}

	/*--------------------------------------------------------------------------
		HANDLER FOR: 'amplitude-mute'

		Handles a click on a mute element.

		TODO: Add a class if muted to this element of amplitude-mute.  That way
		the designer can style the element if amplitude is muted like the typical
		volume with a line through it.

		TODO: Standardize the privateSetVolume parameter so it doesn't need
		to be converted by the privateSetVolume function.  Right now it converts
		up then down again which makes no sense.
	--------------------------------------------------------------------------*/
	function privateMuteClickHandle(){
		/*
			If the current volume in the config is 0, we set the volume to the 
			pre_mute level.  This means that the audio is already muted and
			needs to be restored to the pre_mute level.
			
			Otherwise, we set pre_mute volume to the current volume
			and set the config volume to 0, muting the audio.
		*/
		if( config.volume == 0 ){
			config.volume = config.pre_mute_volume;
		}else{
			config.pre_mute_volume = config.volume;
			config.volume = 0;
		}

		/*
			Calls the core function to set the volume to the computed value
			based on the user's intent.
		*/
		privateSetVolume( config.volume * 100 );

		/*
			Syncs the volume sliders so the visuals align up with the functionality.
			If the volume is at 0, then the sliders should represent that so the user
			has the right starting point.
		*/
		privateSyncVolumeSliders();
	}

	/*--------------------------------------------------------------------------
		HANDLER FOR: 'amplitude-volume-up'

		Handles a click on a volume up element.

		TODO: Standardize the privateSetVolume parameter so it doesn't need
		to be converted by the privateSetVolume function.  Right now it converts
		up then down again which makes no sense.
	--------------------------------------------------------------------------*/
	function privateVolumeUpClickHandle(){
		/*
			The volume range is from 0 to 1 for an audio element. We make this
			a base of 100 for ease of working with.

			If the new value is less than 100, we use the new calculated
			value which gets converted to the proper unit for the audio element.

			If the new value is greater than 100, we set the volume to 1 which
			is the max for the audio element.
		*/
		if( ( ( config.volume * 100 ) + config.volume_increment ) <= 100 ){
			config.volume = config.volume + ( config.volume_increment / 100 );
		}else{
			config.volume = 1;
		}

		/*
			Calls the core function to set the volume to the computed value
			based on the user's intent.
		*/
		privateSetVolume( config.volume * 100 );

		/*
			Syncs the volume sliders so the visuals align up with the functionality.
			If the volume is at 0, then the sliders should represent that so the user
			has the right starting point.
		*/
		privateSyncVolumeSliders();
	}

	/*--------------------------------------------------------------------------
		HANDLER FOR: 'amplitude-volume-down'

		Handles a click on a volume down element.

		TODO: Standardize the privateSetVolume parameter so it doesn't need
		to be converted by the privateSetVolume function.  Right now it converts
		up then down again which makes no sense.
	--------------------------------------------------------------------------*/
	function privateVolumeDownClickHandle(){
		/*
			The volume range is from 0 to 1 for an audio element. We make this
			a base of 100 for ease of working with.

			If the new value is less than 0, we use the new calculated
			value which gets converted to the proper unit for the audio element.

			If the new value is greater than 0, we set the volume to 0 which
			is the min for the audio element.
		*/
		if( ( ( config.volume * 100 ) - config.volume_decrement ) > 0 ){
			config.volume = config.volume - ( config.volume_decrement / 100 );
		}else{
			config.volume = 0;
		}
		/*
			Calls the core function to set the volume to the computed value
			based on the user's intent.
		*/
		privateSetVolume( config.volume * 100 );

		/*
			Syncs the volume sliders so the visuals align up with the functionality.
			If the volume is at 0, then the sliders should represent that so the user
			has the right starting point.
		*/
		privateSyncVolumeSliders();
	}

	/*--------------------------------------------------------------------------
		HANDLER FOR: 'amplitude-volume-slider'

		Handles an input change for a volume slider.

		TODO: Standardize the privateSetVolume parameter so it doesn't need
		to be converted by the privateSetVolume function.  Right now it converts
		up then down again which makes no sense.
	--------------------------------------------------------------------------*/
	function privateVolumeInputHandle(){
		/*
			The range slider has a range of 1 to 100 so we get the value and
			convert it to a range of 0 to 1 and set the volume.
		*/
		config.volume = ( this.value / 100 );

		/*
			Calls the core function to set the volume to the computed value
			based on the user's intent.
		*/
		privateSetVolume( this.value );

		/*
			Syncs the volume sliders so the visuals align up with the functionality.
			If the volume is at 0, then the sliders should represent that so the user
			has the right starting point.
		*/
		privateSyncVolumeSliders();
	}

	/*--------------------------------------------------------------------------
		HANDLER FOR: 'amplitude-song-slider'

		Handles an input change for a song slider.

		TODO: Make an attribute that allows for multiple main song sliders
		allowing the active playing song to be scrubbed from multiple locations
		on the page and is always in sync.
	--------------------------------------------------------------------------*/
	function privateSongStatusBarInputHandle(){
		/*
			We only adjust the time if the song is playing. It wouldn't make
			sense if we adjusted the time while it was paused.
		*/
		if( !config.active_song.paused ){
			/*
				We first check if the song slider is the only one on the page.
				If it is, we can safely assume that the slider is synced with
				the song's progression and adjust the song.
			*/
			if( this.getAttribute('amplitude-singular-song-slider') ){
				privateSetSongLocation( this.value );
			}

			/*
				If the song slider has a song index, we check to see if it matches
				the active song index. If it does, then adjust the song location.
				We do this so we can have multiple Amplitude players on the same page
				and have the slider relate to the song playing.
			*/
			if( this.getAttribute('amplitude-song-index') == config.active_index ){
				privateSetSongLocation( this.value );
			}
		}
	}

	/*--------------------------------------------------------------------------
		HANDLER FOR: 'amplitude-next'

		Handles a click for the next song.
	--------------------------------------------------------------------------*/
	function privateNextClickHandle(){
		/*
			Runs the before_next callback for the user to hook into.
		*/
		privateRunCallback('before_next');

		/*
			Stop active song since we are moving to the next song.
		*/
		privateStop();

		var nextButtonPlaylist = this.getAttribute('amplitude-playlist');

		/* If button is associated with playlist */
		if( nextButtonPlaylist ){
			/* If playlist is currently shuffled */
			if( config.shuffled_statuses[ config.active_playlist ] ){

			}else{
				/* Gets location of active song in playlist */
				var playlistIndex = config.playlists[ nextButtonPlaylist ].songs.indexOf( parseInt( config.active_index ) );

				/* If the active song is in the playlist of the next button that was clicked, continue */
				if( playlistIndex >= 0 ){
					/* Active song is in the playlist. Check to see if we increment the index of the active song, will we have a new song or start from index 0 in the playlist */
					if( parseInt( playlistIndex ) + 1 < config.playlists[ nextButtonPlaylist ].songs.length ){
						var newIndex = config.playlists[ nextButtonPlaylist ].songs[ parseInt( playlistIndex + 1 ) ];
					}else{
						var newIndex = config.playlists[ nextButtonPlaylist ].songs[0];
					}
				}else{
					/* Active song is NOT in the playlist. New index is the first song of the new playlist */
					var newIndex = config.playlists[ nextButtonPlaylist ].songs[0];
				}
			}

			privateSetActivePlaylist( nextButtonPlaylist );
		}else{
			if( config.shuffle_on ){

			}else{
				if( config.active_index + 1 < config.songs.length ){
					var newIndex = config.active_index + 1;
				}else{
					var newIndex = 0;
				}
			}

			/*
				We are not in a playlist anymore.
			*/
			config.active_playlist = '';
		}

		privateSyncNewIndex( newIndex );

		/*
			Runs the song change method to sync everything necessary.
		*/
		privateAfterSongChanges();

		/*
			Fires the after_next callback for users to hook into.
		*/
		privateRunCallback('after_next');
	}

	/*--------------------------------------------------------------------------
		HANDLER FOR: 'amplitude-prev'

		Handles a click for the previous song.
	--------------------------------------------------------------------------*/
	function privatePrevClickHandle(){
		/*
			Runs the before_prev callback for the user to hook into.
		*/
		privateRunCallback('before_prev');
		
		/*
			Stop active song since we are moving to the previous song.
		*/
		privateStop();

		/*
			Gets the playlist attribute from the previous button. This will determine
			if we scope the previous into the playlist or not.
		*/
		var prevButtonPlaylist = this.getAttribute('amplitude-playlist');

		if( prevButtonPlaylist ){
			if( config.shuffled_statuses[ config.active_playlist ] ){

			}else{
				var playlistIndex = config.playlists[ prevButtonPlaylist ].songs.indexOf( parseInt( config.active_index ) );
				
				if( playlistIndex >= 0 ){
					if( parseInt( playlistIndex ) - 1 >= 0 ){
						var newIndex = config.playlists[ prevButtonPlaylist ].songs[ parseInt( playlistIndex - 1 ) ];
					}else{
						var newIndex = config.playlists[ prevButtonPlaylist ].songs[ config.playlists[ prevButtonPlaylist ].songs.length - 1 ];
					}
				}else{
					var newIndex = config.playlists[ prevButtonPlaylist ].songs[0];
				}
			}

			privateSetActivePlaylist( prevButtonPlaylist );
		}else{
			if( config.shuffle_on ){

			}else{
				if( config.active_index - 1 >= 0 ){
					var newIndex = parseInt( config.active_index ) - 1;
				}else{
					var newIndex = parseInt( config.songs.length ) - 1;
				}
			}
		}

		privateSyncNewIndex( newIndex );

		/*
			Runs the song change method to sync everything necessary.
		*/
		privateAfterSongChanges();

		/*
			Fires the after_prev callback for users to hook into.
		*/
		privateRunCallback('after_prev');
	}

	/*--------------------------------------------------------------------------
		HANDLER FOR: 'ended' on main audio element.

		When the song has ended, this method gets called.
		If it's a one song instance, then we don't do anything.
		If there are multiple songs, we check if shuffle is on
		or if we should use the original songs array. Then we set
		the next song and play it.
	--------------------------------------------------------------------------*/
	function privateHandleSongEnded(){
		/*
			Checks to see if repeat is on. If it's on, then we re-play the
			current song. Otherwise we begin the process of playing the
			next song in the list whether it's shuffle or regular list or
			single song.
		*/
		if( config.repeat ){
			/*
				Confirms stop of the active song
			*/
			privateStop();

			/*
				Without changing the index, just prepares the 
				next song to play.
			*/
			privateAfterSongChanges();
		}else{
			/*
				Checks to see if there is more than one song.
			*/
			if( config.songs.length > 1 ){
				/*
					Stops the active song
				*/
				privateStop();

				/*
					Checks to see if shuffle mode is turned on.
				*/
				if( config.shuffle_on ){
					/*
						Loop around shuffle array if at the end. We need to check if the next
						song is within array. Otherwise we reset it to 0.

						Set new song
					*/
					if( parseInt( config.shuffle_active_index) + 1 < config.shuffle_list.length ){
						var newIndex = parseInt( config.shuffle_active_index) + 1;

						/*
							Sets the active song information.
						*/
						privateSetActiveSongInformation( newIndex, config.shuffle_on );

						config.shuffle_active_index = parseInt(config.shuffle_active_index) + 1;
					}else{
						/*
							Sets the active song information to the beginning of the
							shuffle list
						*/
						privateSetActiveSongInformation( 0, config.shuffle_on );

						config.shuffle_active_index = 0;
					}
				}else{
					/*
						Loop around songs array if at the end. We need to check if the next
						song is within array. Otherwise we reset it to 0.

						Sets new song
					*/
					if( parseInt(config.active_index) + 1 < config.songs.length ){
						var newIndex = parseInt( config.active_index ) + 1;

						/*
							Sets the active song information
						*/
						privateSetActiveSongInformation( newIndex, config.shuffle_on );

						config.active_index = parseInt(config.active_index) + 1;
					}else{
						/*
							Sets the active song information to the beginning of the
							songs list
						*/
						privateSetActiveSongInformation( 0, config.shuffle_on );

						config.active_index = 0;
					}
				}

				/*
					Sets the active state to playing that syncs the play pause buttons
				*/
				privateChangePlayPauseState('playing');

				/*
					Runs the song change function.
				*/
				privateAfterSongChanges();
			}else{
				/*
					If there is nothing coming up, pause the play
					button and sync the current times. This will set the play pause
					buttons to paused (stopped) state and the current times to
					0:00
				*/
				privateVisualSyncSetPlayPauseButtonsToPause();
				privateSyncCurrentTimes();			
			}
		}

		/*
			Fire song ended event handler.
		*/
		privateRunCallback('after_song_ended');
	}



	/*--------------------------------------------------------------------------
		HANDLER FOR: 'amplitude-shuffle'

		Handles a click for the shuffle element.
	--------------------------------------------------------------------------*/
	function privateShuffleClickHandle(){
		/*
			If the shuffle is already on, then turn it off
			and clear out the existing shuffle list. We also
			restore the active index back to 0.
		*/
		if( config.shuffle_on ){
			config.shuffle_on = false;
			config.shuffle_list = {};
			config.shuffle_active_index = 0;
		}else{
			/*
				If the shuffle is not on then we turn on shuffle
				and re-shuffle the songs.
			*/
			config.shuffle_on = true;
			privateShuffleSongs();
		}

		/*
			We then sync the visual shuffle button so it has the proper
			class representing the state of the shuffle functionality.
		*/
		privateSyncVisualShuffle();
	}

	/*--------------------------------------------------------------------------
		HANDLER FOR: 'amplitude-repeat'

		Handles a click for the repeat element.
	--------------------------------------------------------------------------*/
	function privateRepeatClickHandle(){
		/*
			If repeat is on, we turn it off. Othwerwise we turn repeat on.
		*/
		if( config.repeat ){
			config.repeat = false;
		}else{
			config.repeat = true;
		}

		privateSyncVisualRepeat();
	}

	/*--------------------------------------------------------------------------
		HANDLER FOR: 'amplitude-playback-speed'

		Handles a click for the adjust playback speed element.
	--------------------------------------------------------------------------*/
	function privateAdjustPlaybackSpeedClickHandle(){
		switch( config.playback_speed ){
			case 1:
				config.playback_speed = 1.5;
			break;
			case 1.5:
				config.playback_speed = 2;
			break;
			case 2:
				config.playback_speed = 1;
			break;
		}
		
		config.active_song.playbackRate = config.playback_speed;

		privateSyncVisualPlaybackSpeed();
	}



	/*--------------------------------------------------------------------------
		Shuffles songs.
		Based off of: http://www.codinghorror.com/blog/2007/12/the-danger-of-naivete.html
	--------------------------------------------------------------------------*/
	function privateShuffleSongs(){
		var shuffle_temp = new Array( config.songs.length );

		for( i = 0; i < config.songs.length; i++ ){
			shuffle_temp[i] = config.songs[i];
		}

		for( i = config.songs.length - 1; i > 0; i-- ){
			rand_num = Math.floor( ( Math.random() * config.songs.length ) + 1 );
			privateShuffleSwap( shuffle_temp, i, rand_num - 1 );
		}

		config.shuffle_list = shuffle_temp;
	}

	/*--------------------------------------------------------------------------
		Swaps and randomizes the song shuffle.

		@param JSON shuffle_list The list of songs that is going to
		be shuffled

		@param int original The original index of the song in the
		songs array.

		@param int random The randomized index that will be the
		new index of the song in the shuffle array.
	--------------------------------------------------------------------------*/
	function privateShuffleSwap( shuffle_list, original, random ){
		var temp = shuffle_list[ original ];
		shuffle_list[ original ] = shuffle_list[ random ];
		shuffle_list[ random ] = temp;
	}



	/*--------------------------------------------------------------------------
		Displays the song duration seconds for the song on the screen

		@param JSON currentTime Object containing the song duration information.
	--------------------------------------------------------------------------*/
	function privateDisplaySyncDurationSeconds( songDuration ){
		if( document.querySelectorAll('.amplitude-duration-seconds[amplitude-main-duration-seconds="true"]').length > 0 ){
			var mainDurationSecondSelectors = document.querySelectorAll('.amplitude-duration-seconds[amplitude-main-duration-seconds="true"]');
			for( var i = 0; i < mainDurationSecondSelectors.length; i++ ){
				mainDurationSecondSelectors[i].innerHTML = songDuration.seconds;
			}
		}

		if( document.querySelectorAll('.amplitude-duration-seconds[amplitude-playlist-main-duration-seconds="'+config.active_playlist+'"]').length > 0 ){
			var playlistMainDurationSecondSelectors = document.querySelectorAll('.amplitude-duration-seconds[amplitude-playlist-main-duration-seconds="'+config.active_playlist+'"]');
			for( var i = 0; i < playlistMainDurationSecondSelectors.length; i++ ){
				playlistMainDurationSecondSelectors[i].innerHTML = songDuration.seconds;
			}
		}

		if( document.querySelectorAll('.amplitude-duration-seconds[amplitude-song-index="'+config.active_index+'"]').length > 0 ){
			var durationSecondSelectors = document.querySelectorAll('.amplitude-duration-seconds[amplitude-song-index="'+config.active_index+'"]');
			for( var i = 0; i < durationSecondSelectors.length; i++ ){
				durationSecondSelectors[i].innerHTML = songDuration.seconds;
			}
		}
	}

	/*--------------------------------------------------------------------------
		Displays the song duration minutes for the song on the screen

		@param JSON currentTime Object containing the song duration information.
	--------------------------------------------------------------------------*/
	function privateDisplaySyncDurationMinutes( songDuration ){
		if( document.querySelectorAll('.amplitude-duration-minutes[amplitude-main-duration-minutes="true"]').length > 0 ){
			var mainDurationMinuteSelectors = document.querySelectorAll('[amplitude-main-duration-minutes="true"]');
			for( var i = 0; i < mainDurationMinuteSelectors.length; i++ ){
				mainDurationMinuteSelectors[i].innerHTML = songDuration.minutes;
			}
		}

		if( document.querySelectorAll('.amplitude-duration-minutes[amplitude-playlist-main-duration-minutes="'+config.active_playlist+'"]').length > 0 ){
			var playlistMainDurationMinuteSelectors = document.querySelectorAll('.amplitude-duration-minutes[amplitude-playlist-main-duration-minutes="'+config.active_playlist+'"]');
			for( var i = 0; i < playlistMainDurationMinuteSelectors.length; i++ ){
				playlistMainDurationMinuteSelectors[i].innerHTML = songDuration.minutes;
			}
		}

		if( document.querySelectorAll('.amplitude-duration-minutes[amplitude-song-index="'+config.active_index+'"]').length > 0 ){
			var durationMinuteSelectors = document.querySelectorAll('.amplitude-duration-minutes[amplitude-song-index="'+config.active_index+'"]');
			for( var i = 0; i < durationMinuteSelectors.length; i++ ){
				durationMinuteSelectors[i].innerHTML = songDuration.minutes;
			}
		}
	}

	/*--------------------------------------------------------------------------
		Displays the song duration hours for the song on the screen

		@param JSON currentTime Object containing the song duration information.
	--------------------------------------------------------------------------*/
	function privateDisplaySyncDurationHours( songDuration ){
		if( document.querySelectorAll('.amplitude-duration-hours[amplitude-main-duration-hours="true"]').length > 0 ){
			var mainDurationHourSelectors = document.querySelectorAll('[amplitude-main-duration-hours="true"]');
			for( var i = 0; i < mainDurationHourSelectors.length; i++ ){
				mainDurationHourSelectors[i].innerHTML = songDuration.hours;
			}
		}

		if( document.querySelectorAll('.amplitude-duration-hours[amplitude-playlist-main-duration-hours="'+config.active_playlist+'"]').length > 0 ){
			var playlistMainDurationHourSelectors = document.querySelectorAll('.amplitude-duration-hours[amplitude-playlist-main-duration-hours="'+config.active_playlist+'"]');
			for( var i = 0; i < playlistMainDurationHourSelectors.length; i++ ){
				playlistMainDurationHourSelectors[i].innerHTML = songDuration.hours;
			}
		}

		if( document.querySelectorAll('.amplitude-duration-hours[amplitude-song-index="'+config.active_index+'"]').length > 0 ){
			var durationHourSelectors = document.querySelectorAll('.amplitude-duration-hours[amplitude-song-index="'+config.active_index+'"]');
			for( var i = 0; i < durationHourSelectors.length; i++ ){
				durationHourSelectors[i].innerHTML = songDuration.hours;
			}
		}
	}

/*
|----------------------------------------------------------------------------------------------------
| HELPER FUNCTIONS
|----------------------------------------------------------------------------------------------------
| For the sake of code clarity, these functions perform helper tasks 
| assisting the logical functions with what they need such as setting
| the proper song index after an event has occured.
|
| Method Prefix: privateHelp
|
| METHODS
|	privateHelpResetConfig()
*/
	/*--------------------------------------------------------------------------
		Resets the config to the default state. This is called on initialize
		to ensure the user's config is what matters.
	--------------------------------------------------------------------------*/
	function privateHelpResetConfig(){
		/*
			Should we not reset this since this should NEVER change?
		*/
		config.active_song = new Audio();

		config.active_metadata = {};

		config.active_album = '';

		config.active_index = 0;

		config.active_playlsit = '';

		config.autoplay = false;

		config.playback_speed = 1.0;

		config.album_change = false;

		config.callbacks = {};

		config.songs = {};

		config.playlists = {};

		config.shuffled_playlists = {};

		config.shuffled_statuses = {};

		config.repeat = false;

		config.shuffle_list = {};

		config.shuffle_on = false;

		config.shuffle_active_index = 0;

		config.default_album_art = '';

		config.debug = false;

		config.initialized = false;

		config.handle_song_elements = true;

		config.volume = .5;

		config.pre_mute_volume = .5;

		config.volume_increment = 5;

		config.volume_decrement = 5;

		config.use_visualizations = false;

		config.visualizations = new Array();

		config.active_visualization = '';

		config.current_visualization = {};

		config.visualization_started = false;

		config.visualization_backup = '';

		config.soundcloud_client = '';

		config.soundcloud_use_art = false;

		config.soundcloud_song_count = 0;

		config.soundcloud_songs_ready = 0;
	}




/*
*
*
*
*
*
*
*
*
*
*
* BELOW ARE UNORGANIZED FUNCTIONS
*
*
*
*
*
*
*
*
*
*/



	function privateGetSongAtPlaylistPosition( playlistIndex, playlist ){
		if( config.shuffled_statuses[playlist] ){
			return config.shuffled_playlists[ playlist ][ playlistIndex ];
		}else{
			return config.playlists[ playlist ].songs[ playlistIndex ];
		}
	}

	function privateGetSongAtIndex( songIndex ){
		return config.songs[ songIndex ];
	}

	/*--------------------------------------------------------------------------
		Finishes the initalization of the config. Takes all of the user defined
		parameters and makes sure they override the defaults. The important
		config information is assigned in the publicInit() function.

		This function can be called from 2 different locations:
		1. Right away on init after the important settings are defined.
		2. After all of the Soundcloud URLs are resolved properly and
		soundcloud is configured.  We will need the proper URLs from Soundcloud
		to stream through Amplitude so we get those right away before we
		set the information and the active song

		@param user_config JSON representation of the user's settings when
		they init Amplitude.

		TODO: In all functions that call privateSetActiveSongInformation, have
		the active_index set there as well.

		TODO: Make sure that if the user sends a start_song that it's an integer
		and nothing else. Debug if NOT an integer.

		TODO: Make the user enter a volume between 0 and 100. It's a little
		easier sounding.

		TODO: Make sure the user enters a volume increment or decrement between
		1 and 100 to ensure something happens when they click the increment
		or decrement button.
	--------------------------------------------------------------------------*/
	function privateSetConfig( user_config ){
		/*
			If Amplitude is not in dynamic mode, we determine what the 
			start song should be. Dynamic mode doesn't have any songs on 
			config because the user will be sending them to Amplitude 
			dynamically.
		*/
		if( !config.dynamic_mode ){
			/*
				If the user provides a starting song index then we set
				the active song information to the song at that index.

				TODO: Find a way to have the user set a specific start song
				on a playlist.
			*/
			if( user_config.start_song != undefined ){
				privateSetActiveSongInformation( config.songs[user_config.start_song] );
				/*
					TODO: REMOVE Sets the user defined index.
				*/
				config.active_index = user_config.start_song;
			}else{
				privateSetActiveSongInformation( config.songs[0] );				

				/*
					TODO: REMOVE Sets the active index to the first song.
				*/
				config.active_index = 0;
			}
		}

		/*
			If the user defined a playback speed, we copy over their
			preference here, otherwise we default to normal playback
			speed of 1.0.
		*/
		config.playback_speed = ( user_config.playback_speed != undefined ? user_config.playback_speed : 1.0 );

		/*
			Sets the playback rate for the current song based on what
			the user defined or the default if nothing was defined.
		*/
		config.active_song.playbackRate = config.playback_speed;

		/*
			If live is not defined, assume it is false. The reason for
			this definition is if we play/pause we disconnect
			and re-connect to the stream so we don't fill up our cache
			with unused audio and we aren't playing outdated audio upon
			resume.
		*/
		if( config.active_metadata.live == undefined ){
			config.active_metadata.live = false;
		}

		/*
			If the user wants the song to be pre-loaded for instant
			playback, they set it to true. By default it's set to just
			load the metadata.
		*/
		config.active_song.preload = ( user_config.preload != undefined ? user_config.preload : "metadata" );
		
		/*
			Initializes the user defined callbacks. This should be a JSON
			object that contains a key->value store of the callback name
			and the name of the function the user needs to call.
		*/
		config.callbacks = ( user_config.callbacks != undefined ? user_config.callbacks : {} );

		/*
			The user can define a starting volume in a range of 0-1 with
			0 being muted and 1 being the loudest. After the config is set
			Amplitude sets the active song's volume to the volume defined
			by the user.
		*/
		config.volume = ( user_config.volume != undefined ? user_config.volume : .5 );
		config.active_song.volume = config.volume;

		/*
			The user can set the volume increment and decrement values between 1 and 100
			for when the volume up or down button is pressed.  The default is an increase
			or decrease of 5.
		*/
		config.volume_increment = ( user_config.volume_increment != undefined ? user_config.volume_increment : 5 );
		config.volume_decrement = ( user_config.volume_decrement != undefined ? user_config.volume_decrement : 5 );

		/*
			The user can turn off Amplitude handling the song elements (putting the meta data into
			certain fields when the song is playing or changed).  This would be if the user wanted
			to hard code this information which would probably be most popular in single song 
			instances.
		*/
		config.handle_song_elements = ( user_config.handle_song_elements != undefined ? user_config.handle_song_elements : true );

		/*
			If the user defines default album art, this image will display if the active
			song doesn't have album art defined.
		*/
		config.default_album_art = ( user_config.default_album_art != undefined ? user_config.default_album_art : '' );		
		
		/*
			The user can define a visualization backup to use if they are using
			visualizations (song visualizations not song time visualizations) and the
			browser doesn't support it.  This can be "nothing" meaning that the
			visualization element is removed otherwise it can be the album art
			of the song being played.
		*/
		config.visualization_backup = ( user_config.visualization_backup != undefined ? user_config.visualization_backup : 'nothing' );

		/*
			Sets initialized to true, so the user can't re-initialize
			and mess everything up.
		*/
		config.initialized = true;

		/*
			Since the user can define a start volume, we want our volume
			sliders to sync with the user defined start value.
		*/
		privateSyncVolumeSliders();

		/*
			Sets up the player if the browser doesn't have the audio context
		*/
		privateSyncNoAudioContext();

		/*
			Set all of the current time elements to 0:00 upon initialization
		*/
		privateSyncCurrentTimes();

		/*
			Syncs all of the song status sliders so the user can't set the
			HTML 5 range element to be something invalid on load like half
			way through the song by default.
		*/
		privateResetSongStatusSliders();

		privateCheckSongVisualization();

		/*
			Syncs the visual playback speed items so the appropriate class
			is added to the item for visual purposes.
		*/
		privateSyncVisualPlaybackSpeed();

		/*
			Initialize the visual elements for the song if the user
			wants Amplitude to handle the changes. This is new 
			compared to previous versions where Amplitude automatically
			handled the song elements.
		*/
		if( config.handle_song_elements ){
			privateDisplaySongMetadata();
		}

		/*
			Removes any classes set by the user so any inconsistencies
			with start song and actual song are displayed correctly.
		*/
		privateSyncVisualPlayingContainers();

		/*
			Sets the active song container for the song that will be
			played. This adds a class to an element containing the
			visual representation of the active song .
		*/
		privateSetActiveContainer();

		/*
			Sets the temporary user conifg back to empty. We are done
			using it.
		*/
		temp_user_config = {};

		/*
			Run after init callback
		*/
		privateRunCallback("after_init");

		/*
			If the user turns on autoplay the song will play automatically.
		*/
		if( user_config.autoplay ){
			/*
				Gets the attribute for song index so we can check if
				there is a need to change the song.  In some scenarios
				there might be multiple play classes on the page. In that
				case it is possible the user could click a different play
				class and change the song.
			*/
			var playing_song_index = config.start_song;

			/*
				We set the new song if the user clicked a song with a different
				index. If it's the same as what's playing then we don't set anything. 
				If it's different we reset all song sliders.
			*/
			if( privateCheckNewSong( playing_song_index ) ){
				privateChangeSong( playing_song_index );

				privateResetSongStatusSliders();
			}

			/*
				Start the visualizations for the song.
			*/
			privateStartVisualization();
			
			/*
				If there are any play pause buttons we need
				to sync them to playing for auto play.
			*/
			privateChangePlayPauseState('playing');

			/*
				Play the song through the core play function.
			*/
			privateCorePlay();
		}
	}

	/*--------------------------------------------------------------------------
		Handles the back up functionality for visualizations. This happens
		if there is no AudioContext available or the song is live.

		The two settings are:
		1. "nothing" DEFAULT. It will remove the visualization element from the
		page.

		2. "album-art" Instead of the visualization, the element that would have
		container for the visualization will instead display the album
		art for the now playing song.

		TODO: Make sure this is only run if the user is using visualizations
		in their design.

		TODO: Change querySelector to querySelectorAll once again justifying
		the use of a global query all function for visual syncing.
	--------------------------------------------------------------------------*/
	function privateHandleVisualizationBackup(){
		switch( config.visualization_backup ){
			/*
				Removes the visualization element from the page.
			*/
			case "nothing":
				
				if( document.getElementById('amplitude-visualization') ){
					document.getElementById('amplitude-visualization').remove();
				}
			break;
			/*
				Sets up the old visualization element to contain the
				album art.
			*/
			case "album-art":
				/*
					Gets the old visualizationelement.
				*/
				var old_visualization = document.getElementById('amplitude-visualization');

				/*
					If there is a visualization element then we proceed.
				*/	
				if( old_visualization ){
					/*
						Gets the parent node to append the inner node to containing
						the album art.
					*/
					var parent_old_visualization = old_visualization.parentNode;

					var new_album_art = document.createElement('img');
					/*
						Sets the attribute to be the song infor for the cover
						art on the new element. Also apply the class 'amplitude-album-art'
					*/
					new_album_art.setAttribute('amplitude-song-info', 'cover');
					new_album_art.setAttribute('class', 'amplitude-album-art');

					/*
						TODO: is this the right place to do this? Shouldn't this happen
						AFTER we replace the visualization?
					*/
					if( document.querySelector('[amplitude-song-info="cover"]') ){

						if( config.active_metadata.cover_art_url != undefined){
							new_album_art.setAttribute( 'src', config.active_metadata.cover_art_url );
							document.querySelector('[amplitude-song-info="cover"]').setAttribute('src', config.active_metadata.cover_art_url);
						}else if( config.default_album_art != '' ){
							new_album_art.setAttribute( 'src', config.default_album_art );
						}else{
							new_album_art.setAttribute( 'src', '' );
						}
					}

					parent_old_visualization.replaceChild( new_album_art, old_visualization );
				}
			break;
		}
	}

	/*--------------------------------------------------------------------------
		Sets information relating to the active song.
	--------------------------------------------------------------------------*/
	function privateSetActiveSongInformation( song ){
		config.active_song.src = song.url;
		config.active_metadata = song;
		config.active_album    = song.album;
	}
	
	/*--------------------------------------------------------------------------
		Writes out debug message to the console if enabled.

		@param string message The string that gets printed to
		alert the user of a debugging error.
	--------------------------------------------------------------------------*/
	function privateWriteDebugMessage( message ){
		if( config.debug ){
			console.log( message );
		}
	}

	/*--------------------------------------------------------------------------
		Checks to see if a new song should be prepared for playing

		@param int new_song_index The integer index of the song
		that will be played. 

		TODO: Should we even have the new song checked if it's a main play pause button
		or a playlist play pause button? It's controlling the active song.
	--------------------------------------------------------------------------*/
	function privateCheckNewSong( newSongIndex, newPlayingPlaylist, newPlayingPlaylistSongIndex ){
		if( newSongIndex == null && newPlayingPlaylist == null && newPlayingPlaylistSongIndex == null ){
			return false;
		}

		if( newSongIndex == null ){
			if( newPlayingPlaylist != config.active_playlist ){
				return true;
			}else if( newPlayingPlaylist == config.active_playlist && newPlayingPlaylistSongIndex != config.active_index ){
				return true;
			}else{
				return false;
			}
		}else{
			if( newSongIndex != null && ( newSongIndex != config.active_index ) ){
				return true;
			}else{
				return false;
			}
		}
	}

	/*--------------------------------------------------------------------------
		Gets Amplitude ready for a song change. Syncs elements and runs
		necessary callbacks.
	--------------------------------------------------------------------------*/
	//function privateChangeSong( song ){
	//	/*
	//		Stops the currently playing song.
	//	*/
	//	privateStop();
//
	//	privateCheckNewAlbum( song.album );
//
	//	/*
	//		Sets the active song information for the new song that will
	//		be played.
	//	*/
	//	privateSetActiveSongInformation( song );
//
	//	if( config.album_change ){
	//		privateRunCallback('after_album_change');
	//		config.album_change = false;
	//	}
//
	//	/*
	//		If it's a new song and the user wants amplitude to handle
	//		the song elements, we need to set the information for
	//		the song.
	//	*/
	//	if( config.handle_song_elements ){
	//		privateDisplaySongMetadata();
	//	}
//
	//	/*
	//		We set the current times to 0:00 when song changes
	//		so all of the pages players will be synchronized.
	//	*/
	//	privateSyncCurrentTimes();
//
	//	privateCheckSongVisualization();
//
	//	privateSetActiveContainer();
//
	//}


	function privateSetActivePlaylist( playlist ){
		if( config.active_playlist != playlist ){
			privateRunCallback('playlist_changed');
		}
		config.active_playlist = playlist;
	}

	/*--------------------------------------------------------------------------
		Checks to see if a new album is playing. This allows for
		multiple albums to be initialized on the same page.
		Through CSS you can show and hide albums and simulate
		multiple playlists. This method is called after there is a for
		sure change to see if the next song's album is different than
		the song that will soon to be previous' album.

		@param string new_album The string of the new album
		to see if it has changed.

		TODO: Research if we should return true/false instead of setting the
		config.

		TODO: Makes sure the song actually has an album before running.
	--------------------------------------------------------------------------*/
	function privateCheckNewAlbum( new_album ){
		/*
			If the new album isn't the same as the
			active album, we set the change to true
			and run the before_album_change callback.
		*/
		if( config.active_album != new_album ){
			config.album_change = true;
			
			privateWriteDebugMessage('There has been an album change');
			
			privateRunCallback('before_album_change');
		}
	}

	/*--------------------------------------------------------------------------
		Runs callback for specific function

		@param string The name of the call back. Also used as the index that
		the user can use in the callback array to define their callback method.
	--------------------------------------------------------------------------*/
	function privateRunCallback( callback_name ){
		if( config.callbacks[callback_name] ){
			var callback_function = window[ config.callbacks[ callback_name ] ];
			
			privateWriteDebugMessage( 'Running Callback: '+callback_name );

			callback_function();
		}
	}

	/*--------------------------------------------------------------------------
		If there is a visualization specifically for a song, we set that
		as the active visualization. Only if one is specified, otherwise
		nothing changes and we continue using the active visualization.

		@returns BOOL Returns true if there is a specific visualization for
		the song.
	--------------------------------------------------------------------------*/
	function privateCheckSongVisualization(){
		var changed = false;

		/*
			Checks to see if the song actually has a specific visualization
			defined.
		*/
		if( config.active_metadata.visualization ){
			
			/*
				If the visualization is different and there is an active
				visualization. We must stop the active visualization
				before setting the new one.
			*/
			if( config.active_metadata.visualization != config.active_visualization && config.active_visualization != '' ){
				privateStopVisualization();
				
				/*
					Set the visualization changed to true
					so we return the status change.
				*/
				changed = true;

				/*
					Sets the active visualization to the new
					visualization that the song uses.
				*/
				config.active_visualization = config.active_metadata.visualization;
			}
		}
		/*
			Returns the status of the new song visualization.
			If there is a change it returns true and we will
			have to start the the visualization.
		*/
		return changed;
	}

	/*--------------------------------------------------------------------------
		Sets the visual elements containg the active song
		metadata
	--------------------------------------------------------------------------*/
	function privateDisplaySongMetadata(){
		var imageMetaDataKeys 	= ['cover_art_url', 'station_art_url', 'podcast_episode_cover_art_url'];
		var ignoredKeys 		= ['url', 'live'];

		for ( key in config.active_metadata ) {
			if( config.active_metadata.hasOwnProperty( key ) ){

				if( ignoredKeys.indexOf( key ) == -1 ){

					if( imageMetaDataKeys.indexOf( key ) >= 0 ){
						/*
							Handle image meta stuff. We also have to update placeholders if there
							isn't an image defined to the default image url.
						*/
					}else{
						if( document.querySelectorAll('[amplitude-song-info="'+key+'"]') ){
							var metaInfo = document.querySelectorAll('[amplitude-song-info="'+key+'"]');

							for( var i = 0; i < metaInfo.length; i++ ){
								if( metaInfo[i].hasAttribute('amplitude-playlist-song-info') && metaInfo[i].getAttribute('amplitude-playlist-song-info') == config.active_playlist ){
									metaInfo[i].innerHTML = config.active_metadata[key];
								}else if( !metaInfo[i].hasAttribute('amplitude-playlist-song-info') ){
									metaInfo[i].innerHTML = config.active_metadata[key];
								}
							}
						}
					}
				}
			}
		}


		/*
			Sets all elements that will contain the active song's cover art metadata
		*/
		if( document.querySelectorAll('[amplitude-song-info="cover"]') ){
			var coverImages = document.querySelectorAll('[amplitude-song-info="cover"]');
			for( i = 0; i < coverImages.length; i++ ){
				/*
					Checks to see if first, the song has a defined cover art and uses
					that. If it does NOT have defined cover art, checks to see if there
					is a default.  Otherwise it just sets the src to '';
				*/
				if( config.active_metadata.cover_art_url != undefined){
					coverImages[i].setAttribute('src', config.active_metadata.cover_art_url);
				}else if( config.default_album_art != '' ){
					coverImages[i].setAttribute('src', config.default_album_art);
				}else{
					coverImages[i].setAttribute('src', '');
				}
			}
			
		}


		/*
			Sets all of the elements that will contain the live stream's station art metadata
			TODO: Rename coverImages to stationArtImages
		*/
		if( document.querySelectorAll('[amplitude-song-info="station-art"]') ){
			var coverImages = document.querySelectorAll('[amplitude-song-info="station-art"]');
			/*
					Checks to see if first, the song has a defined station art and uses
					that. If it does NOT have defined station art, checks to see if there
					is a default.  Otherwise it just sets the src to '';
				*/
			for( i = 0; i < coverImages.length; i++ ){
				if( config.active_metadata.cover_art_url != undefined){
					coverImages[i].setAttribute('src', config.active_metadata.station_art_url);
				}else if( config.default_album_art != '' ){
					coverImages[i].setAttribute('src', config.default_album_art);
				}else{
					coverImages[i].setAttribute('src', '');
				}
			}	
		}

		/*
			Sets all of the elements that will contain the podcast episode's cover art.
		*/
		if( document.querySelectorAll('[amplitude-song-info="podcast-episode-cover-art"]') ){
			var coverImages = document.querySelectorAll('[amplitude-song-info="podcast-episode-cover-art"]');
			
			/*
					Checks to see if first, the podcast episode has a defined cover art and uses
					that. If it does NOT have defined cover art, checks to see if there
					is a default.  Otherwise it just sets the src to '';
				*/
			for( i = 0; i < coverImages.length; i++ ){
				if( config.active_metadata.podcast_episode_cover_art != undefined){
					coverImages[i].setAttribute('src', config.active_metadata.podcast_episode_cover_art);
				}else if( config.default_album_art != '' ){
					coverImages[i].setAttribute('src', config.default_album_art);
				}else{
					coverImages[i].setAttribute('src', '');
				}
			}	
		}
	}

	/*--------------------------------------------------------------------------
		Applies the class 'amplitude-active-song-container' to the element 
		containing visual information regarding the active song.

		TODO: Make sure that when shuffling, this changes accordingly.
	--------------------------------------------------------------------------*/
	function privateSetActiveContainer(){
		var songContainers = document.getElementsByClassName('amplitude-song-container');

		/*
			Removes all of the active song containrs.
		*/
		for( i = 0; i < songContainers.length; i++ ){
			songContainers[i].classList.remove('amplitude-active-song-container');
		}

		/*
			Finds the active index and adds the active song container to the element
			that represents the song at the index. 
		*/
		if( document.querySelectorAll('.amplitude-song-container[amplitude-song-index="'+config.active_index+'"]') ){
			var songContainers = document.querySelectorAll('.amplitude-song-container[amplitude-song-index="'+config.active_index+'"]');

			for( i = 0; i < songContainers.length; i++ ){
				songContainers[i].classList.add('amplitude-active-song-container');
			}
		}
	}

	

	/*--------------------------------------------------------------------------
		Calls the start method on the active visualization.
	--------------------------------------------------------------------------*/
	function privateStartVisualization(){
		/*
			If the visualization is not started, and there are visualizations
			ready to be activated, we check to see if the user defined a 
			starting visualization.  If there is a starting visualization,
			then we start that one, otherwise we grab the first visualization
			defined and start that one.
		*/

		if( !config.visualization_started && Object.keys(config.visualizations).length > 0){
			if( config.active_visualization != '' ){
				config.visualizations[config.active_visualization].startVisualization(config.active_song);
				config.current_visualization = config.visualizations[config.active_visualization];
			}else{
				for(first_visualization in config.visualizations);

				config.visualizations[first_visualization].startVisualization(config.active_song);
				config.current_visualization = config.visualizations[first_visualization];
			}
			config.visualization_started = true;
		}
	}

	/*--------------------------------------------------------------------------
		Calls the stop method of the active visualization.
		If the visualization is started, we stop it.
	--------------------------------------------------------------------------*/
	function privateStopVisualization(){
		if( config.visualization_started && Object.keys(config.visualizations).length > 0){
			config.current_visualization.stopVisualization();
			config.visualization_started = false;
		}
	}

/*
|----------------------------------------------------------------------------------------------------
| SOUNDCLOUD HELPERS
|----------------------------------------------------------------------------------------------------
| These helpers wrap around the basic methods of the Soundcloud API
| and get the information we need from SoundCloud to make the songs
| streamable through Amplitude
|
| Method Prefix: privateSoundCloud
*/
	/*--------------------------------------------------------------------------
		Loads the soundcloud SDK for use with Amplitude so the user doesn't have
		to load it themselves.
		With help from: http://stackoverflow.com/questions/950087/include-a-javascript-file-in-another-javascript-file
	--------------------------------------------------------------------------*/
	function privateSoundCloudLoad(){
		var head = document.getElementsByTagName('head')[0];
		var script = document.createElement('script');

		script.type = 'text/javascript';
		/*
			URL to the remote soundcloud SDK
		*/
		script.src = 'https://connect.soundcloud.com/sdk.js';
		script.onreadystatechange = privateInitSoundcloud;
		script.onload = privateInitSoundcloud;

		head.appendChild( script );
	}

	/*--------------------------------------------------------------------------
		Initializes soundcloud with the key provided.
	--------------------------------------------------------------------------*/
	function privateInitSoundcloud(){
		/*
			Calls the SoundCloud initialize function
			from their API and sends it the client_id
			that the user passed in.
		*/
		SC.initialize({
			client_id: config.soundcloud_client
		});

		/*
			Gets the streamable URLs to run through Amplitue. This is
			VERY important since Amplitude can't stream the copy and pasted
			link from the SoundCloud page, but can resolve the streaming
			URLs from the link.
		*/
		privateGetSoundcloudStreamableURLs();
	}

	/*--------------------------------------------------------------------------
		Gets the streamable URL from the URL provided for
		all of the soundcloud links.  This will loop through
		and set all of the information for the soundcloud
		urls.
	--------------------------------------------------------------------------*/
	function privateGetSoundcloudStreamableURLs(){
		var soundcloud_regex = /^https?:\/\/(soundcloud.com|snd.sc)\/(.*)$/;
		
		for( var i = 0; i < config.songs.length; i++ ){
			/*
				If the URL matches soundcloud, we grab
				that url and get the streamable link
				if there is one.
			*/
			if( config.songs[i].url.match( soundcloud_regex ) ){
				config.soundcloud_song_count++;
				privateSoundcloudResolveStreamable(config.songs[i].url, i);
			}
		}
	}

	/*--------------------------------------------------------------------------
		Due to Soundcloud SDK being asynchronous, we need to scope the
		index of the song in another function. The privateGetSoundcloudStreamableURLs
		function does the actual iteration and scoping.
	--------------------------------------------------------------------------*/
	function privateSoundcloudResolveStreamable(url, index){
		SC.get('/resolve/?url='+url, function( sound ){
			/*
				If streamable we get the url and bind the client ID to the end
				so Amplitude can just stream the song normally. We then overwrite
				the url the user provided with the streamable URL.
			*/
			if( sound.streamable ){
				config.songs[index].url = sound.stream_url+'?client_id='+config.soundcloud_client;

				/*
					If the user want's to use soundcloud art, we overwrite the
					cover_art_url with the soundcloud artwork url.
				*/
				if( config.soundcloud_use_art ){
					config.songs[index].cover_art_url = sound.artwork_url;
				}

				/*
					Grab the extra metadata from soundcloud and bind it to the
					song.  The user can get this through the public function:
					getActiveSongMetadata
				*/
				config.songs[index].soundcloud_data = sound;
			}else{
				/*
					If not streamable, then we print a message to the user stating
					that the song with name X and artist X is not streamable. This
					gets printed ONLY if they have debug turned on.
				*/
				privateWriteDebugMessage( config.songs[index].name +' by '+config.songs[index].artist +' is not streamable by the Soundcloud API' );
			}
			/*
				Increments the song ready counter.
			*/
			config.soundcloud_songs_ready++;

			/*
				When all songs are accounted for, then amplitude is ready
				to rock and we set the rest of the config.
			*/
			if( config.soundcloud_songs_ready == config.soundcloud_song_count ){
				privateSetConfig( temp_user_config );
			}
		});
	}

/*
|----------------------------------------------------------------------------------------------------
| VISUAL SYNCHRONIZATION METHODS
|----------------------------------------------------------------------------------------------------
| These methods keep the screen in sync.  For example if there are multiple
| play/pause buttons and a song changes, we need to set all of the other
| play/pause buttons to paused state.
|
| Method Prefix: privateVisualSync
*/
	/*--------------------------------------------------------------------------
		Sets all of the play/pause buttons to the not playing state.  The 
		click handler will set the actual playing button to the playing state.
	--------------------------------------------------------------------------*/
	function privateVisualSyncSetPlayPauseButtonsToPause(){
		var play_pause_classes = document.getElementsByClassName("amplitude-play-pause");
		/*
			Iterates over all of the play pause classes removing
			the playing class and adding the paused class.
		*/
		for( var i = 0; i < play_pause_classes.length; i++ ){
			play_pause_classes[i].classList.add('amplitude-paused');
			play_pause_classes[i].classList.remove('amplitude-playing');
		}
	}

	/*--------------------------------------------------------------------------
		Changes the play pause state for all classes that need it. This
		iterates through all of the amplitude-play-pause classes for the 
		active index and all of the amplitude-main-play-puase attributes
		making sure everything stays in sync.
	--------------------------------------------------------------------------*/
	function privateChangePlayPauseState( state ){
		privateVisualSyncSetPlayPauseButtonsToPause();
		
		/*
			If the state is playing we set all of the classes accordingly.
		*/
		if( state == 'playing' ){
			/*
				Individual Songs
			*/
			if( document.querySelectorAll('.amplitude-play-pause[amplitude-song-index="'+config.active_index+'"]').length > 0 ){
				var currentPlayPauseControls = document.querySelectorAll('.amplitude-play-pause[amplitude-song-index="'+config.active_index+'"]');
				
				/*
					Iterates over all of the play pause controls adding the
					'amplitude-playing' classes and removing the 'amplitude-paused'
					classes.
				*/
				for( var i = 0; i < currentPlayPauseControls.length; i++ ){
					currentPlayPauseControls[i].classList.add('amplitude-playing');
					currentPlayPauseControls[i].classList.remove('amplitude-paused');
				}
			}

			/*
				Playlist
			*/
			if( document.querySelectorAll('.amplitude-play-pause[amplitude-playlist-main-play-pause="'+config.active_playlist+'"]').length > 0 ){
				var playlistPlayPauseControls = document.querySelectorAll('.amplitude-play-pause[amplitude-playlist-main-play-pause="'+config.active_playlist+'"]');

				for( var i = 0; i < playlistPlayPauseControls.length; i++ ){
					playlistPlayPauseControls[i].classList.add('amplitude-playing');
					playlistPlayPauseControls[i].classList.remove('amplitude-paused');
				}
			}


			/*
				Sets the main song control statuses to playing by removing the
				'amplitude-paused' class and adding the 'amplitude-playing' class.
			*/
			if( document.querySelectorAll('[amplitude-main-play-pause="true"]').length > 0 ){
				var mainControls = document.querySelectorAll('[amplitude-main-play-pause="true"]');

				for( var i = 0; i < mainControls.length; i++ ){
					mainControls[i].classList.add('amplitude-playing');
					mainControls[i].classList.remove('amplitude-paused');
				}
			}

		}

		/*
			If the state is paused, we set all of the classes accordingly.
		*/
		if( state == 'paused' ){
			privateVisualSyncSetPlayPauseButtonsToPause();
		}
	}

	/*--------------------------------------------------------------------------
		Sets all of the volume sliders to the active song's volume. 
	--------------------------------------------------------------------------*/
	function privateSyncVolumeSliders(){
		var amplitude_volume_sliders = document.getElementsByClassName("amplitude-volume-slider");

		/*
			Iterates over all of the volume sliders for the song, setting the value
			to the config value.
		*/
		for( var i = 0; i < amplitude_volume_sliders.length; i++ ){
			amplitude_volume_sliders[i].value = config.active_song.volume * 100;
		}
	}

	/*--------------------------------------------------------------------------
		Handles the situation if there is no audio context
		available
	--------------------------------------------------------------------------*/
	function privateSyncNoAudioContext(){
		if( !window.AudioContext ){
			privateHandleVisualizationBackup();
		}
	}

	/*--------------------------------------------------------------------------
		Syncs the current time displays so you can have multiple song time
		displays. When a song changes, we need the current minutes and seconds
		to go to 0:00
	--------------------------------------------------------------------------*/
	function privateSyncCurrentTimes(){
		var current_minute_times = document.getElementsByClassName("amplitude-current-minutes");

		for( var i = 0; i < current_minute_times.length; i++ ){
			current_minute_times[i].innerHTML = '00';
		}

		var current_second_times = document.getElementsByClassName("amplitude-current-seconds");

		for( var i = 0; i < current_second_times.length; i++ ){
			current_second_times[i].innerHTML = '00';
		}
	}

	/*--------------------------------------------------------------------------
		For visual playing containers, we find all containers that
		have a class of 'amplitude-song-container' and remove all of 
		the additional 'amplitude-active-song-container' classes.
		When a new song is activated, it will find the parameter
		'amplitude-song-index' and the class of 'amplitude-song-container'
		and give it the additional class 'amplitude-active-song-container'.
	--------------------------------------------------------------------------*/
	function privateSyncVisualPlayingContainers(){
		var visual_playing_containers = document.getElementsByClassName("amplitude-song-container");

		for( var i = 0; i < visual_playing_containers.length; i++ ){
			visual_playing_containers[i].classList.remove('amplitude-active-song-container');
		}
	}

	/*--------------------------------------------------------------------------
		Sets shuffle on for all of the shuffle buttons. Users
		can apply styles to the amplitude-shuffle-on and 
		amplitude-shuffle-off classes. They represent the state
		of the playlist.
	--------------------------------------------------------------------------*/
	function privateSyncVisualShuffle(){
		var shuffle_classes = document.getElementsByClassName("amplitude-shuffle");

		for( var i = 0; i < shuffle_classes.length; i++ ){
			if( config.shuffle_on ){
				shuffle_classes[i].classList.add('amplitude-shuffle-on');
				shuffle_classes[i].classList.remove('amplitude-shuffle-off');
			}else{
				shuffle_classes[i].classList.remove('amplitude-shuffle-on');
				shuffle_classes[i].classList.add('amplitude-shuffle-off');
			}
		}
	}

	/*--------------------------------------------------------------------------
		Sets repeat on for all of the repeat buttons. Users
		can apply styles to the amplitude-repeat-on and 
		amplitude-repeat-off classes. They represent the state
		of the player.
	--------------------------------------------------------------------------*/
	function privateSyncVisualRepeat(){
		var repeat_classes = document.getElementsByClassName("amplitude-repeat");

		for( var i = 0; i < repeat_classes.length; i++ ){
			if( config.repeat ){
				repeat_classes[i].classList.add('amplitude-repeat-on');
				repeat_classes[i].classList.remove('amplitude-repeat-off');
			}else{
				repeat_classes[i].classList.remove('amplitude-repeat-on');
				repeat_classes[i].classList.add('amplitude-repeat-off');
			}
		}
	}

	/*--------------------------------------------------------------------------
		Sets all of the visual playback speed buttons to have the right class
		to display the background image that represents the current playback
		speed.
	--------------------------------------------------------------------------*/
	function privateSyncVisualPlaybackSpeed(){
		/*
			Gets all of the playback speed classes.
		*/
		var playback_speed_classes = document.getElementsByClassName("amplitude-playback-speed");

		/*
			Iterates over all of the playback speed classes
			applying the right speed class for visual purposes.
		*/
		for( var i = 0; i < playback_speed_classes.length; i++ ){
			/*
				Removes all of the old playback speed classes.
			*/
			playback_speed_classes[i].classList.remove('amplitude-playback-speed-10');
			playback_speed_classes[i].classList.remove('amplitude-playback-speed-15');
			playback_speed_classes[i].classList.remove('amplitude-playback-speed-20');

			/*
				Switch the current playback speed and apply the appropriate 
				speed class.
			*/
			switch( config.playback_speed ){
				case 1:
					playback_speed_classes[i].classList.add('amplitude-playback-speed-10');
				break;
				case 1.5:
					playback_speed_classes[i].classList.add('amplitude-playback-speed-15');
				break;
				case 2:
					playback_speed_classes[i].classList.add('amplitude-playback-speed-20');
				break;
			}
		}
	}



	/*
		Defines which methods and variables are public.
	*/
	return {
		init: publicInit,
		setDebug: publicSetDebug,
		getActiveSongMetadata: publicGetActiveSongMetadata,
		getSongByIndex: publicGetSongByIndex,
		playNow: publicPlayNow,
		play: publicPlay,
		pause: publicPause,
		registerVisualization: publicRegisterVisualization,
		visualizationCapable: publicVisualizationCapable,
		changeVisualization: publicChangeActiveVisualization,
		addSong: publicAddSong,
		analyser: publicGetAnalyser,
		active: config.active_song
	};
})();