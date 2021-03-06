// if (typeof (plt) === 'undefined') {
//     this.plt = {};
// }
// if (typeof (plt.wescheme) === 'undefined') {
//     this.plt.wescheme = {};
// }

goog.provide('plt.wescheme.WeSchemeEditor');

goog.require('plt.wescheme.AjaxActions');
goog.require('plt.config');
goog.require('plt.wescheme.WeSchemeIntentBus');
goog.require('plt.wescheme.SharingDialog');
goog.require('plt.wescheme.NotesDialog');
goog.require('plt.wescheme.WeSchemeInteractions');
goog.require('plt.wescheme.helpers');
goog.require('plt.wescheme.tokenizer');

var WeSchemeEditor;

(function() {

    // The timeout between autosaving.
    var AUTOSAVE_TIMEOUT = 10000;

    //
    // These are the dependencies we're trying to maintain.
    //

    // isDirty: true if the file has been changed
    //          false when the file becomes saved.

    // saveButton: enabled only when the definitions area is dirty
    //             and the file hasn't been published
    //             and you own the file
    //             and you are logged in (non-"null" name)

    //
    // cloneButton: enabled when you are logged in (non-"null" name)
    //              and the file isn't dirty

    //
    // runButton: enabled all the time

    // the definitions and filename areas: readonly if you don't own the file,


    //////////////////////////////////////////////////////////////////////

    WeSchemeEditor = function(attrs, afterInit) {
	var that = this;

	this.userName = attrs.userName; // string
	this.actions = new plt.wescheme.AjaxActions();

        this.onResize = undefined;

	// defn is assumed to be Containers.
	// The only container we've got so far are TextContainers.
	this.defn = attrs.defn;  // TextAreaContainer
	this.isOwner = false;


        this.suppressWarningBeforeUnloadE = receiverE();
        // suppressWarningBeforeUnloadB: Behavior boolean
        // Used to suppress the save warning.  Use
        // suppressWarningBeforeUnloadE.sendEvent() to trigger.
        this.suppressWarningBeforeUnloadB = startsWith(
						       this.suppressWarningBeforeUnloadE,
						       false);



	new plt.wescheme.WeSchemeInteractions(
					      attrs.interactions,
					      function(interactions) {
						  that.interactions = interactions;

						  that.interactions.setSourceHighlighter(function(id, offset, line, column, span, color) {
							  that.unhighlightAll();
							  return that.highlight(id, offset, line, column, span, color);
						      });

						  that.interactions.setAddToCurrentHighlighter(function(id, offset, line, column, span, color) {
							  return that.highlight(id, offset, line, column, span, color);
						      });

						  that.interactions.addOnReset(function() {that.defn.unhighlightAll()});
						  that.interactions.setMoveCursor(function(id, offset){that.moveCursor(id, offset)});
						  that.interactions.setScrollIntoView(function(id, offset, margin){that.scrollIntoView(id, offset, margin)});
						  that.interactions.setFocus(function(id){that.focus(id)});
						  that.interactions.addSetSelection(function(id, offset, line, column, span){
							  that.setSelection(id, offset, line, column, span);});

						  // pid: (or false number)
						  that.pid = false;


						  //////////////////////////////////////////////////////////////////////
						  // Flapjax stuff.

						  // The program title:
						  that.filenameEntry = new FlapjaxValueHandler(
											       attrs.filenameInput.get(0));

						  that.filenameEntry.node.type = "text";
						  that.filenameEntry.setValue("");

						  // Any time the filenameEntry changes, adjust the
						  // document's title to match it.
						  that.filenameEntry.behavior.changes().mapE(function(v) {
							  document.title = (plt.wescheme.helpers.trimWhitespace(v) ||
									    "<< Unnamed Program >>");
							  plt.wescheme.WeSchemeIntentBus.notify("filename-changed", that);
						      });

						  that.defn.getSourceB().changes().mapE(function() {
							  //when text changes, everything unhighlighted
							  that.unhighlightAll();
							  plt.wescheme.WeSchemeIntentBus.notify("definitions-changed", that);
						      });

						  //////////////////////////////////////////////////////////////////////
						  // EVENTS
						  //////////////////////////////////////////////////////////////////////

						  // savedE is a boolean eventStream which receives true
						  // when a save has happened.
						  that.savedE = receiverE();

						  // loadedE is a boolean eventStream that receives true whenever
						  // a load has happened.
						  that.loadedE = receiverE();

						  // publishedE is a boolean eventStream that receives true whenever
						  // a program has been published;
						  that.isPublishedE = receiverE();

						  // contentChangedE event fires true if the source or filename
						  // changes.
						  that.contentChangedE = mergeE(
										constantE(changes(that.defn.getSourceB()), true),
										constantE(changes(that.filenameEntry.behavior), true));


						  that.isOwnerE = receiverE();

						  // loggedInB is a boolean behavior that's true when the user has
						  // logged in.
						  that.isLoggedInB = constantB(that._getIsLoggedIn());


						  // The program id pid as a behavior.
						  // A number or false behavior.
						  that.pidB = startsWith(
									 that.loadedE.mapE(function(v) {
										 return that.pid; }),
									 that.pid);


						  // Returns true if the file is new.
						  that.isNewFileB = startsWith(
									       changes(that.pidB).mapE(function(v) {
										       return that.pid == false; }),
									       that.pid == false);


						  that.isPublishedB = startsWith(that.isPublishedE,
										 false);


						  // isOwnerB is a boolean behavior that's true if we own the file,
						  // and false otherwise.  It changes on load.
						  that.isOwnerB = startsWith(that.isOwnerE, that.isOwner);


						  // isDirtyB is initially false, and changes when
						  // saves or changes to the source occur.
						  that.isDirtyB = startsWith(
									     mergeE(// false if we loaded a file
										    constantE(that.loadedE, false),
										    // false when the file becomes saved.
										    constantE(that.savedE, false),
										    // true if the content has changed.
										    constantE(that.contentChangedE, true)),
									     false);

						  // isAutosaveEnabledB: enabled only when the definitions area is dirty
						  //             and it hasn't been published yet
						  //             and you own the file
						  //             and you are logged in (non-"null" name)
						  that.isAutosaveEnabledB = andB(that.isDirtyB,
										 notB(that.isPublishedB),
										 that.isOwnerB,
										 that.isLoggedInB);

						  // We'll fire off an autosave if the content has changed and
						  // saving is enabled, and it's not a new file.
						  that.autosaveRequestedE =
						      calmE(andE(that.contentChangedE,
								 changes(that.isAutosaveEnabledB)),
							    constantB(AUTOSAVE_TIMEOUT));



						  //////////////////////////////////////////////////////////////////////
						  //////////////////////////////////////////////////////////////////////
						  // HOOKS

						  // Autosave
						  that.autosaveRequestedE.mapE(function(v) {
							  if (v) {
							      that._autosave();
							  }
						      });

						  if (afterInit) {
						      afterInit(that);
						  }
					      });

    };

    // Inserting the value of a boolean behavior into the enabled
    // attribute of a node.
    function insertEnabledB(aBooleanBehavior, jQueryNode) {
	function f(v) {
	    if (v) {
		jQueryNode.removeAttr("disabled");
	    } else {
		jQueryNode.attr("disabled", "true");
	    }

	}
	f(valueNow(aBooleanBehavior));
	aBooleanBehavior.changes().mapE(f);
    }


    WeSchemeEditor.prototype.setOnResize = function(onResize) {
        this.onResize = onResize;
    };


    // Force a refresh on the size of the editor.
    WeSchemeEditor.prototype.forceOnResize = function() {
        this.onResize();
    };


    // Allow multi-colored error highlighting to be disabled
    // experimentally.
    // Forward this call off to the interactions, which handles
    // evaluation and error handling.
    WeSchemeEditor.prototype.disableColoredErrorMessages = function() {
        this.interactions.disableColoredErrorMessages();
    };


    WeSchemeEditor.prototype.highlight = function(id, offset, line, column, span, color) {
    	if(id === '<no-location>'){
	    //do nothing
    	}
	else if (id === '<definitions>') {
	    return this.defn.highlight(id, offset, line, column, span, color);
	} else if (this.interactions.previousInteractionsTextContainers[id]) {
	    return this.interactions.previousInteractionsTextContainers[id].highlight(id, offset, line, column, span, color);
	}
    };

    WeSchemeEditor.prototype.setSelection = function(id, offset, line, column, span, color) {
    	if (id === '<definitions>') {
	    this.defn.setSelection(id, offset, line, column, span);
	} else if (this.interactions.previousInteractionsTextContainers[id]) {
	    this.interactions.previousInteractionsTextContainers[id].setSelection(id, offset, line, column, span);
	}
    };

    WeSchemeEditor.prototype.unhighlightAll = function() {
    	var key;
	for(key in this.interactions.previousInteractionsTextContainers) {
	    if (this.interactions.previousInteractionsTextContainers.hasOwnProperty(key)) {
		this.interactions.previousInteractionsTextContainers[key].unhighlightAll();
	    }
	}
	this.defn.unhighlightAll();
    };

    WeSchemeEditor.prototype.moveCursor = function(id, offset) {
    	if (id === '<definitions>') {
	    this.defn.moveCursor(offset);
	} else if (this.interactions.previousInteractionsTextContainers[id]) {
	    this.interactions.previousInteractionsTextContainers[id].moveCursor(offset);
	}
    };

    WeSchemeEditor.prototype.scrollIntoView = function(id, offset, margin) {
    	if (id === '<definitions>') {
	    this.defn.scrollIntoView(offset, margin);
	} else if (this.interactions.previousInteractionsTextContainers[id]) {
	    this.interactions.previousInteractionsTextContainers[id].scrollIntoView(offset, margin);
	}
    };

    WeSchemeEditor.prototype.focus = function(id) {
	if (id === '<definitions>') {
	    this.defn.focus();
	} else if (this.interactions.previousInteractionsTextContainers[id]) {
	    this.interactions.previousInteractionsTextContainers[id].focus();
	}
    };

    // WeSchemeEditor._getIsLoggedIn: -> boolean
    // Returns true if the user has been logged in.
    WeSchemeEditor.prototype._getIsLoggedIn = function() {
	return (this.userName && this.userName != 'null');
    };

    // WeSchemeEditor._autosave: -> void
    WeSchemeEditor.prototype._autosave = function() {
	plt.wescheme.WeSchemeIntentBus.notify("autosave", this);
	this.save();
    };

    WeSchemeEditor.prototype.save = function(success, fail, cancel) {
	var that = this;
	var afterSave = function(pid) {
	    that.pid = pid;

	    that.savedE.sendEvent(true);
	    plt.wescheme.WeSchemeIntentBus.notify("after-save", that);
            if (success) { success(); }
        }
	var whenSaveBreaks = function() {
	    alert("Unable to save");
            if (fail) { fail(); }
	};

	var onFirstSave = function() {
	    that.actions.save({ pid: false,
		                title: that.filenameEntry.attr("value"),
		                code : that.defn.getCode()},
		doPageReload,
		whenSaveBreaks);
	};

	var onUpdate = function() {
	    that.actions.save({ pid: that.pid,
		                title: that.filenameEntry.attr("value"),
		                code : that.defn.getCode()},
		afterSave,
		whenSaveBreaks);
	};

	var afterFileNameChosen = function() {
	    plt.wescheme.WeSchemeIntentBus.notify("before-save", that);
	    if (that.pid == false) {
		onFirstSave();
	    } else {
		if (valueNow(that.isPublishedB)) {
		    that.actions.makeAClone(
					    that.pid,
					    that.defn.getCode(),
					    function(newPid) {
						that.actions.save(
	{ pid: newPid,
	  title: that.filenameEntry.attr("value"),
	  code : that.defn.getCode()},
	function() {
	    afterSave(newPid);
	    doPageReload(newPid);
	},
	whenSaveBreaks);
					    },
					    whenSaveBreaks);
		} else {
		    onUpdate();
		}
	    }
	};

        var doPageReload = function(pid) {
            that.suppressWarningBeforeUnloadE.sendEvent(true);
            plt.wescheme.WeSchemeIntentBus.notify("before-editor-reload-on-save", that)
	    window.location =
	    "/openEditor?pid=" + encodeURIComponent(pid);
        };


	that.filenameEntry.attr("value",
				plt.wescheme.helpers.trimWhitespace(
								    that.filenameEntry.attr("value")));
	that._enforceNonemptyName(afterFileNameChosen,
				  function() {
				      // on abort, don't do anything.
                                      if (cancel) { cancel(); }
				  },
				  true);
    };

    WeSchemeEditor.prototype._enforceNonemptyName = function(afterK, abortK, isFirstEntry) {
	var that = this;
	var title = plt.wescheme.helpers.trimWhitespace(that.filenameEntry.attr("value"));
	if (title === "") {
	    var dialogWindow = (jQuery("<div/>"));

            var buttonPressed = false;

	    var onSaveButton = function() {
		buttonPressed = true;
		dialogWindow.dialog("close");
		that.filenameEntry.attr("value",
					plt.wescheme.helpers.trimWhitespace(
									    inputField.attr("value")));
		that._enforceNonemptyName(afterK, abortK, false);
	    };

	    var onCancelButton = function() {
                buttonPressed = true;
		dialogWindow.dialog("close");
		abortK();
	    };

	    var inputField = jQuery("<input type='text' style='border: solid'/>");
	    dialogWindow.append(jQuery("<p/>").text(
						    "Please provide a name for your program: "));
	    dialogWindow.append(jQuery("<p/>").text(
						    "(The name cannot be left blank.)"));
	    dialogWindow.append(inputField);

	    dialogWindow.dialog({title: 'Saving your program',
			bgiframe : true,
			modal : true,
			overlay : {opacity: 0.5,
			    background: 'black'},
			buttons : { "Save" : onSaveButton,
			    "Don't Save" : onCancelButton }
		});

            dialogWindow.bind("dialogclose",
                              function(event, ui) {
                                  if (! buttonPressed) {
                                      abortK();
                                  }
                              });


	    // Really stupid hacky code.  I have no idea how to
	    // cleanly grab at the buttons in a dialog constructed by
	    // jQuery-UI, so the following code does it by manually
	    // walking the dom tree.
	    var saveButton;
	    dialogWindow.dialog("widget").parent().find(":button")
		.each(function(index) {
			if (jQuery(this).text() === "Save") {
			    saveButton = this;
			}
		    });
	    var maintainSaveButtonStatus = function() {
		// Disable the save button if its content doesn't validate.
		setTimeout(
			   function() {
			       var name =
			       plt.wescheme.helpers.trimWhitespace(inputField.val());
			       if (name === "") {
				   saveButton.disabled = true;
				   jQuery(saveButton).hide('fast');
			       } else {
				   saveButton.disabled = false;
				   jQuery(saveButton).show('fast');
			       }
			   },
			   0);
	    };
	    maintainSaveButtonStatus();
	    inputField.keydown(maintainSaveButtonStatus);
	    inputField.change(maintainSaveButtonStatus);
	} else {
	    afterK();
	}
    };

    WeSchemeEditor.prototype.load = function(attrs, onSuccess, onFail) {
	var that = this;


	var whenLoadSucceeds = function(aProgram) {
 	    that.pid = aProgram.getId();
 	    var publicUrl = getAbsoluteUrl(
					   "/openEditor?publicId=" +
					   encodeURIComponent(aProgram.getPublicId()));
 	    that.filenameEntry.attr("value", aProgram.getTitle());

            if (attrs.pid) {
 	        that.defn.setCode(aProgram.getSourceCode());
            } else {
                if (attrs.publicId && aProgram.isSourcePublic()) {
 	            that.defn.setCode(aProgram.getSourceCode());
                } else {
 	            that.defn.setCode(";;  << Source code has not been shared >>");
                }
            }

	    if (that.userName === aProgram.getOwner()) {
		that._setIsOwner(true);
	    } else {
		that._setIsOwner(false);
	    }
	    that.loadedE.sendEvent(true);
	    that.isPublishedE.sendEvent(aProgram.isPublished());
	    plt.wescheme.WeSchemeIntentBus.notify("after-load", that);
	    if (onSuccess) { onSuccess(aProgram.getSourceCode()); }
	};

	var whenLoadFails = function() {
	    // FIXME
	    alert("The load failed.");
	    if (onFail) { onFail(); }
	};

	if (attrs.pid) {
	    plt.wescheme.WeSchemeIntentBus.notify("before-load", this);
	    that.actions.loadProject(attrs.pid,
				     undefined,
				     whenLoadSucceeds,
				     whenLoadFails);
	} else if (attrs.publicId) {
	    plt.wescheme.WeSchemeIntentBus.notify("before-load", this);
	    that.actions.loadProject(undefined,
				     attrs.publicId,
				     whenLoadSucceeds,
				     whenLoadFails);
	} else {
	    throw new Error("pid or publicId required");
	}
    };

    function getAbsoluteUrl(relativeUrl) {
	var anchor = document.createElement("a");
	anchor.href = relativeUrl;
	return anchor.href;
    }


    WeSchemeEditor.prototype.share = function() {
	var dialog = new plt.wescheme.SharingDialog(this.pid, this.defn.getCode());
	dialog.show();
    };


    WeSchemeEditor.prototype.showNotesDialog = function() {
        var dialog = new plt.wescheme.NotesDialog(this.pid);
        var onSuccess = function() {
        };
        var onFail = function() {
        };
        dialog.show(onSuccess, onFail);
    };

    
    // Shows an Image Picker enabling choosing an image from Google Drive to the 
    // Definitions console. The image chosen will be translated into a function
    // call in the form (bitmap/url <image_url>).
    WeSchemeEditor.prototype.showPicker = function(defnInFocus) {

	// Create and render a Picker object for searching images.
	var APP_ID = plt.config.APP_ID;
	function createPicker() {
	    var view = new google.picker.View(google.picker.ViewId.DOCS);
	    view.setMimeTypes("image/png,image/jpeg,image/jpg");
	    var picker = new google.picker.PickerBuilder()
		.enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
		.setAppId(APP_ID)
		.addView(view)
		.addView(new google.picker.DocsUploadView())
		.setCallback(pickerCallback)
		.build();
	    picker.setVisible(true);
	}

	var editor = defnInFocus ? this.defn : this.interactions.prompt.textContainer;
	var data;

	// Setting the image permissions for anyone having 
	// the link.
        function setPermissionsAndInsertCode(fileId, body) {
	    var request = gapi.client.drive.permissions.insert({
		    'fileId': fileId,
		    'resource': body
		});
       
	    request.execute(function(resp) { }); 
       
	    // Insert the generated code for producing the image in the 
	    // definitions console.
	    var code = editor.getCode();
	    var curPos = editor.getCursorStartPosition();
	    var preCursorCode = code.slice(0, curPos);
	    var postCursorCode = code.slice(curPos, code.length);
	    var pathToImg = "\"https://drive.google.com/uc?export=download&id=" + fileId + "\"";
	    editor.setCode(preCursorCode + "(bitmap/url "+ pathToImg +")"+postCursorCode);
	}
    

	function handleAuthResult(authResult) {
	    if (authResult){
		// fileId: the unique id of the image in Google Drive.                                                                                               
		var fileId = this.data.docs[0].id;

		// Setting the permissions for the image url so that the image is                                                                                                           // made public.                                                                                                                                                
		var body =
		{
		    "role": "reader",
		    "type": "anyone",
		    "value": "default",
		    "withLink": true
		};
	    
		gapi.client.load('drive', 'v2', setPermissionsAndInsertCode.bind(this, fileId, body));
	    }
	    else {
		// console.log("There has been an error with the authorisation.");
	    }
	}

      
	// A simple callback implementation.
	function pickerCallback(data) {
	    if (data.action == google.picker.Action.PICKED) {
		// OAuth2.0
		var SCOPES = [
			      'https://www.googleapis.com/auth/drive.file',
			      'https://www.googleapis.com/auth/drive'
			      ];
		
		//var CLIENT_ID = "979522551881-h4kj3gi4p7bm93jb9asec6i807tudps2.apps.googleusercontent.com";
		var CLIENT_ID = plt.config.CLIENT_ID;
		this.data = data;
		gapi.auth.authorize({
	                      'client_id': CLIENT_ID,
                              'scope': SCOPES.join(' '),			
		              'immediate': false
				  }, 
		    handleAuthResult.bind(this));
	    }
	}

	// Primary function call for creating picker         
	createPicker();
    }
    

    WeSchemeEditor.prototype.run = function(after) {
	var that = this;
	plt.wescheme.WeSchemeIntentBus.notify("before-run", this);
	this.interactions.reset();
	this.interactions.runCode(
	    this.defn.getCode(),
	    "<definitions>",
	    function() {
		plt.wescheme.WeSchemeIntentBus.notify("after-run", that);
		if (after) { after(); }
	    });
    };

    WeSchemeEditor.prototype.getDefinitionsText = function() {
        return this.defn.getCode();
    };

    WeSchemeEditor.prototype.setDefinitionsText = function(v) {
        this.defn.setCode(v);
    };

    WeSchemeEditor.prototype.requestBreak = function() {
	this.interactions.requestBreak();
    };

    WeSchemeEditor.prototype._setIsOwner = function(v) {
	this.isOwner = v;
	this.isOwnerE.sendEvent(v);
    };

    WeSchemeEditor.prototype.toString = function() { return "WeSchemeEditor()"; };

    // FIXME: copy and paste from console.js
    // makeShareUrl: string -> string
    // Produces the sharing url
    function makeShareUrl(publicId) {
      // TODO: This does not always explicitly return a value.
	if (publicId != "") {
	    var a = document.createElement("a");
	    a.href = "/view?publicId=" + encodeURIComponent(publicId);
	    a.appendChild(document.createTextNode(a.href));
	    return jQuery(a);
	}
    }



    WeSchemeEditor.prototype.getTokenizer = function() {
        return plt.wescheme.tokenizer;
    };

})();

plt.wescheme.WeSchemeEditor = WeSchemeEditor;
