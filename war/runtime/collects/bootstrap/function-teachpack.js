// This is automatically generated by bootstrap-js-compiler.ss
// Please don't hand-edit this file.
if (typeof(plt) == 'undefined') { plt = {}; }
if (typeof(plt._MODULES) == 'undefined') { plt._MODULES = {}; }
if (typeof(plt._MODULES["bootstrap/function-teachpack"]) == 'undefined') {
    plt._MODULES["bootstrap/function-teachpack"] =         { COMPILER_VERSION: "2.31",
	BINDINGS: {},
	EXPORTS : {},
	isInvoked: false};
    (function() {
var _SHARED = {};
var WIDTH; 
var HEIGHT; 
var IMAGE0; 
var source; 
var ROCKET; 
var world = function (current_dash_height,rocket_dash_height) { plt.types.Struct.call(this, "make-world", [current_dash_height,rocket_dash_height]);this.current_dash_height = current_dash_height;
this.rocket_dash_height = rocket_dash_height; };
world.prototype = new plt.types.Struct();

var make_dash_world = function (id0,id1) { return new world(id0,id1); };
var world_dash_current_dash_height = function(obj) {
     if (world_question_ (obj)) {
        return obj.current_dash_height;
     } else {
        throw new plt.Kernel.MobyRuntimeError(            plt.Kernel.format('world-current-height: not a world: ~s', [obj]));
     }
};

var world_dash_rocket_dash_height = function(obj) {
     if (world_question_ (obj)) {
        return obj.rocket_dash_height;
     } else {
        throw new plt.Kernel.MobyRuntimeError(            plt.Kernel.format('world-rocket-height: not a world: ~s', [obj]));
     }
};

var set_dash_world_dash_current_dash_height_bang_ = function(obj,newVal) {
	 if (world_question_ (obj)) {
		obj.current_dash_height = newVal;
           obj._fields[0] = newVal;     } else {
        throw new plt.Kernel.MobyRuntimeError(            plt.Kernel.format('set_dash_world_dash_current_dash_height_bang_: not a world: ~s', [obj]));
     }
};

var set_dash_world_dash_rocket_dash_height_bang_ = function(obj,newVal) {
	 if (world_question_ (obj)) {
		obj.rocket_dash_height = newVal;
           obj._fields[1] = newVal;     } else {
        throw new plt.Kernel.MobyRuntimeError(            plt.Kernel.format('set_dash_world_dash_rocket_dash_height_bang_: not a world: ~s', [obj]));
     }
};

var world_question_ = function(obj) { 
              return obj != null && obj != undefined && obj instanceof world; };

var draw_dash_world = function(w) { return text_dash_add(plt.Kernel.apply(world_dash_rocket_dash_height(w),                    plt.Kernel.list([world_dash_current_dash_height(w)]),                    []),rocket_dash_add(w,IMAGE0)); };
var text_dash_add = function(height, IMAGE0) { return plt.world.Kernel.placeImage(plt.world.Kernel.text(plt.Kernel.string_dash_append([_SHARED[6],plt.Kernel.number_dash__greaterthan_string(height)]),_SHARED[7],(plt.types.Symbol.makeInstance("black"))),_SHARED[8],_SHARED[9],IMAGE0); };
var rocket_dash_add = function(w, IMAGE0) { return (plt.Kernel._greaterthan__equal_(plt.world.Kernel.imageHeight(ROCKET),plt.Kernel._dash_(HEIGHT, [plt.Kernel.apply(world_dash_rocket_dash_height(w),                    plt.Kernel.list([world_dash_current_dash_height(w)]),                    [])]), []) ?
 plt.world.Kernel.placeImage(ROCKET,_SHARED[10],_SHARED[1],IMAGE0) :
 (plt.types.Logic.TRUE ?
 plt.world.Kernel.placeImage(ROCKET,_SHARED[10],plt.Kernel._dash_(HEIGHT, [plt.Kernel.apply(world_dash_rocket_dash_height(w),                    plt.Kernel.list([world_dash_current_dash_height(w)]),                    [])]),IMAGE0) :
 plt.Kernel.error((plt.types.Symbol.makeInstance("cond")),_SHARED[11]))); };
var tock = function(w, ke) { return make_dash_world(plt.Kernel._plus_([_SHARED[12],world_dash_current_dash_height(w)]),world_dash_rocket_dash_height(w)); };
var start = function(rocket_dash_height) { return plt.world.MobyJsworld.bigBang(make_dash_world(_SHARED[9],rocket_dash_height), [plt.world.config.Kernel.onKey((plt.types.liftToplevelToFunctionValue(tock,(plt.types.String.makeInstance("tock")),2,(plt.types.Rational.makeInstance(2, 1))))),plt.world.config.Kernel.onRedraw((plt.types.liftToplevelToFunctionValue(draw_dash_world,(plt.types.String.makeInstance("draw-world")),1,(plt.types.Rational.makeInstance(1, 1)))))]); };_SHARED[10] = (plt.types.Rational.makeInstance(100, 1));
_SHARED[2] = (plt.types.Rational.makeInstance(600, 1));
_SHARED[11] = (plt.types.String.makeInstance("cond: fell out of cond"));
_SHARED[3] = (plt.types.String.makeInstance("http://www.wescheme.org/images/teachpacks/rocket.png"));
_SHARED[6] = (plt.types.String.makeInstance("Height: "));
_SHARED[1] = (plt.types.Rational.makeInstance(200, 1));
_SHARED[7] = (plt.types.Rational.makeInstance(14, 1));
_SHARED[8] = (plt.types.Rational.makeInstance(60, 1));
_SHARED[12] = (plt.types.Rational.makeInstance(1, 1));
_SHARED[4] = (plt.types.Rational.makeInstance(2, 1));
_SHARED[9] = (plt.types.Rational.makeInstance(0, 1));

        plt._MODULES["bootstrap/function-teachpack"].invoke = function() {             ((function (toplevel_dash_expression_dash_show0) { 
WIDTH = _SHARED[1];
HEIGHT = _SHARED[2];
IMAGE0 = plt.world.Kernel.emptyScene(WIDTH,HEIGHT);
source = plt.world.Kernel.openImageUrl(_SHARED[3]);
ROCKET = plt.world.Kernel.put_dash_pinhole(source,plt.Kernel._slash_(plt.world.Kernel.imageWidth(source), [_SHARED[4]]),plt.world.Kernel.imageHeight(source));





 }))( function(x){return x;} );
plt._MODULES["bootstrap/function-teachpack"].EXPORTS["start"] = start;
  };
     }());
}
