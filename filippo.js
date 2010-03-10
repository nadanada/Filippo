( function() {
    /*
    Author:  Markus Nix <mnix@markusnix.com>

    BSD License
    -----------

    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions are met:

        * Redistributions of source code must retain the above copyright
          notice, this list of conditions and the following disclaimer.
        * Redistributions in binary form must reproduce the above copyright
          notice, this list of conditions and the following disclaimer in the
          documentation and/or other materials provided with the distribution.
        * Neither the name of the organization nor the
          names of its contributors may be used to endorse or promote products
          derived from this software without specific prior written permission.

    THIS SOFTWARE IS PROVIDED BY MARKUS NIX ``AS IS`` AND ANY
    EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
    WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL MARKUS NIX BE LIABLE FOR ANY
    DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
    (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
    LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
    ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
    (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
    SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

    Vector and Matrix Math is based on Sylvester <http://sylvester.jcoglan.com/>.
    Licensed under the MIT License.
    */

    var LIBRARY         = 'Filippo';
    var VERSION         = '0.7.0';

    var NS_SVG          = 'http://www.w3.org/2000/svg';
    var NS_VML          = 'urn:schemas-microsoft-com:vml';

    var SCENE_ID_PREFIX = 'scene-';
    var POLY_ID_PREFIX  = 'poly-';

    var M               = Math;
    var PRECISION       = 1.0e-6;
    var DEG_TO_RAD      = M.PI / 180;
    var RAD_TO_DEG      = 180 / M.PI;

    var SQRT_EIGHTH     = M.sqrt( 0.125 );
    var SQRT_2          = M.sqrt( 2.0 );
    var SQRT_3          = M.sqrt( 3.0 );
    var SQRT_5          = M.sqrt( 5.0 );

    var OBJECT_REF      = {};
    var POLY_REF        = {};

    var $i              = parseInt;
    var $f              = parseFloat;
    var $n              = isNaN;
    var _d              = document;


    // common

    function $empty() {
    };

    function $extend( original, extended ) {
        for ( var key in ( extended || {} ) ) {
            original[key] = extended[key];
        }

        return original;
    };

    function $splat( obj ) {
        var type = $t( obj );
        return type? ( ( type != 'array' )? [obj] : obj ) : [];
    };
    
    function $each( iterable, fn ) {
        if ( $t( iterable ) == 'object' ) {
            for ( var key in iterable ) {
                fn( iterable[key], key );
            }
        } else {
            for ( var i = 0; i < iterable.length; i++ ) {
                fn( iterable[i], i );
            }
        }
    };

    function $merge() {
        var obj, mix = {};

        for ( var i = 0, l = arguments.length; i < l; i++ ) {
            obj = arguments[i];

            if ( $t( obj ) != 'object' ) {
                continue;
            }

            for ( var key in obj ) {
                var op = obj[key], mp = mix[key];
                mix[key] = ( mp && ( $t( op ) == 'object' ) && ( $t( mp ) == 'object' ) )? $merge( mp, op ) : $unlink( op );
            }
        }

        return mix;
    };

    function $unlink( object ) {
        var unlinked;

        switch ( $t( object ) ) {
            case 'object':
                unlinked = {};

                for ( var p in object ) {
                    unlinked[p] = $unlink( object[p] );
                }

                break;

            case 'array':
                unlinked = [];

                for ( var i = 0, l = object.length; i < l; i++ ) {
                    unlinked[i] = $unlink( object[i] );
                }

                break;

            default:
                return object;
        }

        return unlinked;
    };

    function $console( str, level ) {
        level = level || 'log';

        try {
            if ( console && ( level in console ) ) {
                console[level]( LIBRARY + ': ', str );
            }
        } catch ( ex ) {
        }
    };
    
    function $bound( val, min, max ) {
        if ( ( $t( min ) != 'undefined' ) && ( val < min ) ) {
            val = min;
        }
        
        if ( ( $t( max ) != 'undefined' ) && ( val > max ) ) {
            val = max;
        }
        
        return val;
    };

    function $( id ) {
        return ( $t( id ) === 'string' )? _d.getElementById( id ) : id;
    };

    function $append( elm, par ) {
        par.insertBefore? par.insertBefore( elm, null ) : par.appendChild( elm );
        return elm;
    };

    function $c( v, attributes, styles ) {
        var vml_map = {
            path: '<fvml:shape class="fvml">',
            line: '<fvml:line  class="fvml">',
            g:    '<fvml:group class="fvml">',
            text: '<div>'
        };

        var elm = $extend( Client.hasSVG? _d.createElementNS( NS_SVG, v ) : _d.createElement( vml_map[v] ), {
            attr: function( key, val ) {
                if ( $t( arguments[0] ) == 'object' ) {
                    $each( arguments[0], function( v, k ) {
                        this.attr( k, v );
                    }.$bind( this ) );

                    return this;
                }

                if ( Client.hasSVG ) {
                    switch ( key ) {
                        case 'from':
                            val = val.split( ',' );
                            this.setAttribute( 'x1', val[0] );
                            this.setAttribute( 'y1', val[1] );
                            break;

                        case 'to':
                            val = val.split( ',' );
                            this.setAttribute( 'x2', val[0] );
                            this.setAttribute( 'y2', val[1] );
                            break;

                        case 'color':
                            this.setAttribute( 'fill', val );
                            break;

                        case 'opacity':
                            this.setAttribute( 'fill-opacity', val / 100 );
                            break;

                        case 'innerText':
                            this.firstChild.replaceData( 0, 108, val );
                            break;

                        default:
                            this.setAttribute( key, val );
                    }
                } else {
                    switch ( key ) {
                        case 'fill':
                            this.fillcolor = val;
                            break;

                        case 'stroke':
                            this.strokecolor = val;
                            break;

                        case 'stroke-width':
                            this.strokeweight = val;
                            break;

                        case 'visibility':
                            this.style.visibility = val;
                            break;

                        case 'x':
                            this.style.left = val;
                            break;

                        case 'y':
                            this.style.top = val;
                            break;

                        case 'd':
                            this.path = val;
                            break;

                        case 'color':
                            this.style.color = val;
                            break;

                        case 'opacity':
                            // this.fillopacity = val;
                            break;

                        default:
                            this[key] = val;
                    }
                }

                return this;
            }
        } );

        if ( $t( attributes ) == 'object' ) {
            elm.attr( attributes );
        }

        if ( $t( styles ) == 'object' ) {
            $each( styles, function( val, key ) {
                elm.style[key] = val;
            } );
        }

        return elm;
    };

    Function.prototype.$bind = function( ctx ) {        var self = this;        
        return function() {            return self.apply( ctx, arguments );        };    };

    Array.prototype.$in = function( val ) {
        for ( var i = 0; i < this.length; i++ ) {
            if ( this[i] === val ) {
                return true;
            }
        }

        return false;
    };

    Array.prototype.$apply = function( key, val ) {
        for ( var i = 0; i < this.length; i++ ) {
            this[i][key] = val;
        }
    };

    Array.prototype.$fill = function( c, val ) {
        this.length = 0;

        for ( var i = 0; i < c; i++ ) {
            this[i] = val;
        }
        
        return this;
    };

    Array.prototype.$without = function( val ) {
        var a = [];

        for ( var i = 0; i < this.length; i++ ) {
            if ( this[i] != val ) {
                a.push( this[i] );
            }
        }

        return a;
    };

    Date.$interval = function( v ) {
        var b = 140 * 24 * 60 * 60 * 1000; // 140 days
        
        // 140 days < 5 months
        if ( v >= b ) {
            b = 8766 * 60 * 60 * 1000;

            if ( v < b         ) return b / 12;
            if ( v < b * 2     ) return b / 6;
            if ( v < b * 5 / 2 ) return b / 4;
            if ( v < b * 5     ) return b / 2;
            if ( v < b * 10    ) return b;
            if ( v < b * 20    ) return b * 2;
            if ( v < b * 50    ) return b * 5;
            if ( v < b * 100   ) return b * 10;
            if ( v < b * 200   ) return b * 20;
            if ( v < b * 500   ) return b * 50;

            return b * 100;
        }
          
        b /= 2; // 70 days

        if ( v >= b ) return b / 5;
        b /= 2;
        if ( v >= b ) return b / 5;
        b /= 7; b *= 4;
        if ( v >= b ) return b / 5;
        b /= 2;
        if ( v >= b ) return b / 5;
        b /= 2;
        if ( v >= b ) return b / 5;
        b /= 2;
        if ( v >= b ) return b / 5;
        b *= 3; b /= 5;
        if ( v >= b ) return b / 6;
        b /= 2;
        if ( v >= b ) return b / 6;
        b *= 2; b /= 3;
        if ( v >= b ) return b / 6;
        b /= 2;
        if ( v >= b ) return b / 6;
        b /= 2;
        if ( v >= b ) return b / 6;
        b /= 2;
        if ( v >= b ) return b / 6;
        b *= 2; b /= 3;
        if ( v >= b ) return b / 6;
        b /= 3;
        if ( v >= b ) return b / 4;
        b /= 2;
        if ( v >= b ) return b / 5;
        b /= 2;
        if ( v >= b ) return b / 5;
        b *= 3; b /= 2;
        if ( v >= b ) return b / 6;
        b /= 2;
        if ( v >= b ) return b / 6;
        b *= 2; b /= 3;
        if ( v >= b ) return b / 6;
        b /= 3;
        if ( v >= b ) return b / 4;
        b /= 2;
        if ( v >= b ) return b / 5;

        return b / 10; // 1 sec
    };

    Date.$format = function( v, i, tp ) {
        var y, m, d, h, n, s, vd = new Date( v );
        var mth = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split( ' ' );
        var wd  = 'Sun Mon Tue Wed Thu Fri Sat'.split( ' ' );

        if ( i > 15 * 24 * 60 * 60 * 1000 ) {
            if ( i < 365 * 24 * 60 * 60 * 1000 ) {
                vd.setTime( v + 15 * 24 * 60 * 60 * 1000 );
                y = vd.getYear() % 100;

                if ( y < 10 ) {
                    y = '0' + y;
                }

                m = vd.getUTCMonth() + 1;

                if ( tp == 4 ) {
                    return mth[m - 1];
                }

                if ( tp == 3 ) {
                    return mth[m - 1] + ' ' + y;
                }

                return m + '/' + y;
            }

            vd.setTime( v + 183 * 24 * 60 * 60 * 1000 );
            y = vd.getYear();

            return y;
        }

        vd.setTime( v );
        m = vd.getUTCMonth() + 1;
        d = vd.getUTCDate();
        w = vd.getUTCDay();
        h = vd.getUTCHours();
        n = vd.getUTCMinutes(); 
        s = vd.getUTCSeconds();

        if ( i >= 86400000 ) {
            if ( tp == 4 ) return wd[w];
            if ( tp == 3 ) return m + '/' + d;
    
            return d + '.' + m + '.';
        }

        if ( i >= 21600000 ) {
            if ( h == 0 ) { 
                if ( tp == 4 ) return wd[w];
                if ( tp == 3 ) return m + '/' + d;
      
                return d + '.' + m + '.';
            } else { 
                if ( tp == 4 ) return ( h <= 12 )? h + 'am' : h % 12 + 'pm';
                if ( tp == 3 ) return ( h <= 12 )? h + 'am' : h % 12 + 'pm';
                
                return h + ':00';
            }
        }

        if ( i >= 60000 ) {
            if ( n < 10 ) {
                n = '0' + n;
            }

            if ( tp == 4 ) {
                return ( h <= 12 )? h + '.' + n + 'am' : h % 12 + '.' + n + 'pm';
            }

            n = ( ( n == '00' )? '' : ':' + n );

            if ( tp == 3 ) {
                return ( h <= 12 )? h + n + 'am' : h % 12 + n + 'pm';
            }

            if ( n == '' ) {
                n = ':00';
            }

            return h + n;
        }

        if ( s < 10 ) {
            s = '0' + s;
        }

        return n + ':' + s;
    };

    var $t = function( ele ) {
        return ele? $t.s.call( ele ).match( /^\[object\s(.*)\]$/ )[1].toLowerCase() : 'undefined';
    };

    $t.s = Object.prototype.toString;


    // Class mechanism

    var Class = function( properties ) {
        properties = properties || {};

        var klass = function() {
            this.constructor = klass;

            if ( Class.prototyping ) {
                return this;
            }

            return this.initialize? this.initialize.apply( this, arguments ) : this;
        };

        for ( var mutator in Class.Mutators ) {
            if ( !properties[mutator] ) {
                continue;
            }

            properties = Class.Mutators[mutator]( properties, properties[mutator] );
            delete properties[mutator];
        }

        $extend( klass, this );

        klass.constructor = Class;
        klass.prototype   = properties;

        return klass;
    };

    Class.Mutators = {
        $extends: function( self, klass ) {
            Class.prototyping = klass.prototype;
            var subclass = new klass;
            delete subclass.$super;
            subclass = Class.inherit( subclass, self );
            delete Class.prototyping;

            return subclass;
        },

        $implements: function( self, klasses ) {
            $each( $splat( klasses ), function( klass ) {
                Class.prototying = klass;
                $extend( self, ( $t( klass ) == 'function' )? new klass : klass );
                delete Class.prototyping;
            } );
        
            return self;
        }
    };

    $extend( Class, {
        inherit: function( object, properties ) {
            var caller = arguments.callee.caller;

            for ( var key in properties ) {
                var override = properties[key];
                var previous = object[key];
                var type     = $t( override );

                if ( previous && ( type == 'function' ) ) {
                    if ( override != previous ) {
                        if ( caller ) {
                            override.__super = previous;
                            object[key] = override;
                        } else {
                            Class.override( object, key, override );
                        }
                    }
                } else if ( type == 'object' ) {
                    object[key] = $merge( previous, override );
                } else {
                    object[key] = override;
                }
            }

            if ( caller ) {
                object.$super = function() {
                    return arguments.callee.caller.__super.apply( this, arguments );
                };
            }

            return object;
        },

        override: function( object, name, method ) {
            var parent = Class.prototyping;
            
            if ( parent && ( object[name] != parent[name] ) ) {
                parent = null;
            }

            var override = function() {
                var previous = this.$super;
                this.$super  = parent? parent[name] : object[name];
                var value    = method.apply( this, arguments );
                this.$super  = previous;

                return value;
            };

            object[name] = override;
        }
    } );


    // Client object

    var Client = ( function() {
        var ua      = navigator.userAgent.toLowerCase();
        var isOpera = ( Object.prototype.toString.call( window.opera ) == '[object Opera]' );
        var isIE    = ( !!window.attachEvent && !isOpera );
        var hasSVG  = ( !isIE && _d.implementation   && _d.implementation.hasFeature( 'http://www.w3.org/TR/SVG11/feature#BasicStructure', '1.1' ) );
        var hasVML  = (  isIE && _d.createStyleSheet && _d.namespaces && ( function() {
            var div = _d.createElement( 'div' );
            div.innerHTML = '<!--[if vml]--><br><!--[endif]-->';
            return ( div.childNodes.length == 3 );
        } )() );

        if ( hasVML ) {
            _d.createStyleSheet().addRule( '.fvml', 'behavior:url(#default#VML)' );
            _d.namespaces.add( 'fvml', NS_VML );
        }

        return {
            hasSVG:    hasSVG,
            hasVML:    hasVML,
            isCapable: hasSVG || hasVML,

            Opera:     isOpera,
            IE:        isIE,
            WebKit:    ( ua.indexOf( 'applewebkit/' ) > -1 ),
            Chrome:    ( ua.indexOf( 'chrome' ) > -1 ),
            Gecko:     ( ua.indexOf( 'gecko'  ) > -1 ) && ( ua.indexOf( 'khtml' ) === -1 )
        };
    } )();


    // Util object

    var Util = {
        identifyObject: function( evt, obj ) {
            return OBJECT_REF[Client.hasSVG? evt.target.id : obj.id] || false;
        },

        identifyPoly: function( evt, obj ) {
            return POLY_REF[Client.hasSVG? evt.target.id : obj.id]   || false;
        },

        rnd: function( v ) {
            return M.floor( M.random() * v );
        },

        degToRad: function( angle ) {
            return ( angle / 180 ) * M.PI;
        },

        pathify: function( a ) {
            var first = a.shift();

            if ( Client.hasSVG ) {
                str = 'M ' + $i( first[0] ) + ' ' + $i( first[1] ) + ' ';

                for ( i = 0; i < a.length; i++ ) {
                    str += 'L ' + $i( a[i][0] ) + ' ' + $i( a[i][1] ) + ' ';
                }

                str += 'z';
            } else {
                str = 'm ' + $i( first[0] ) + ',' + $i( first[1] ) + ' l';

                for ( i = 0; i < a.length; i++ ) {
                    str += ( ( i == 0 )? ' ' : '' ) + $i( a[i][0] ) + ',' + $i( a[i][1] ) + ( ( i < a.length - 1 )? ',' : '' );
                }

                str += ' x e';
            }

            return str;
        },

        hexParts: function( str ) {
            return {
                r: $i( str.substr( 1, 2 ), 16 ),
                g: $i( str.substr( 3, 2 ), 16 ),
                b: $i( str.substr( 5, 2 ), 16 )
            }
        }
    };


    // Event object

    var Evt = ( function() {
        function mapEventType( evType, elm ) {
            if ( ( ( evType == 'keypress' ) && ( navigator.appVersion.match( /Konqueror|Safari|KHTML/ ) ) || elm.attachEvent ) ) {
                evType = 'keydown';
            }

            if ( ( evType == 'mousewheel' ) && Client.Gecko ) {
                evType = 'DOMMouseScroll';
            }

            return evType;
        };

        return {
            register: function( elm, evType, fn, useCapture ) {
                evType = mapEventType( evType.toLowerCase(), elm );

                if ( elm.addEventListener ) {
                    elm.addEventListener( evType, fn, useCapture || false );
                } else if ( elm.attachEvent ) {
                    elm.attachEvent( 'on' + evType, fn );
                } else {
                    elm['on' + evType] = fn;
                }
 
                return elm;
            },

            release: function( elm, evType, fn ) {
                evType = mapEventType( evType.toLowerCase(), elm );

                if ( elm.removeEventListener ) {
                    elm.removeEventListener( evType, fn, false );
                } else if ( elm.detachEvent ) {
                    elm.detachEvent( 'on' + evType, fn );
                } else {
                    var et = evType.toUpperCase();

                    if ( elm.Event && elm.Event[et] && elm.releaseEvents ) {
                        elm.releaseEvents( Event[et] );
                    }

                    if ( elm['on' + evType] && ( elm['on' + evType] == fn ) ) {
                        elm.et = null;
                    }
                }

                return elm;
            },

            wheel: function( evt ) {
                var delta = 0;
        
                if ( window.event ) {
                    evt = window.event;
                }
        
                if ( evt.wheelDelta ) {
                    delta = evt.wheelDelta / 120;
                } else if ( evt.detail ) {
                    delta = -evt.detail / 3;
                }

                return M.round( delta );
            },

            isLeftClick: function( evt ) {
                return ( ( evt.which || evt.button ) == 1 );
            },

            getTarget: function( evt ) {
                return evt.target || evt.srcElement;
            },

            pos: function( evt, ele ) {
                var t = l = 0;
    
                if ( window.event ) {
                    evt = window.event;
                }

                do {
                    t += ele.offsetTop  || 0;
                    l += ele.offsetLeft || 0;
                
                    ele = ele.offsetParent;
                } while ( ele );

                return {
                    x: ( evt.pageX || ( evt.clientX /*+ ( _d.documentElement.scrollLeft || _d.body.scrollLeft )*/ ) ) - l,
                    y: ( evt.pageY || ( evt.clientY /*+ ( _d.documentElement.scrollTop  || _d.body.scrollTop  )*/ ) ) - t
                };
            },

            stop: function( evt ) {
                if ( window.event ) {
                    evt = window.event;
                }

                if ( evt.preventDefault  ) evt.preventDefault();
                if ( evt.stopPropagation ) evt.stopPropagation();

                evt.cancelBubble = true;
                evt.returnValue  = false;
            },

            enableKeyboard: function( keyHandler ) {
                if ( document.addEventListener ) {
                    Evt.register( document, 'keypress', keyHandler, true );
                } else {
                    if ( self.Event && self.Event.KEYPRESS ) {
                        document.captureEvents( Event.KEYPRESS );
                    }
        
                    document.onkeypress = keyHandler;
                }
    
                // remap key codes
                window.document.onkeydown = function( evt ) {
                    if ( window.event ) {
                        if ( window.event.ctrlKey || window.event.metaKey || window.event.altKey ) {
                            return true;
                        }
        
                        var k = window.event.keyCode;

                        if ( k == 8 ) {
                            keyHandler( {which:  8} );
                        } else if ( k == 37 ) {
                            keyHandler( {which: 28} );
                        } else if ( k == 39 ) {
                            keyHandler( {which: 29} );
                        } else if ( k == 38 ) {
                            keyHandler( {which: 30} );
                        } else if ( k == 40 ) {
                            keyHandler( {which: 31} );
                        } else if ( k == 27 ) {
                            keyHandler( {which: 27} );
                        } else if ( ( k >= 57373 ) && ( k <= 57376 ) ) {
                            if ( k == 57373 ) {
                                keyHandler( {which: 30} );
                            } else if ( k == 57374 ) {
                                keyHandler( {which: 31} );
                            } else if ( k == 57375 ) {
                                keyHandler( {which: 28} );
                            } else if ( k == 57376 ) {
                                keyHandler( {which: 29} );
                            }
                        } else {
                            window.event.cancleBubble = false;
                            return true;
                        }

                        Evt.stop( evt );
                        return false;
                    }

                    return true;
                }
            }
        };
    } )();


    // Transition object

    var Transition = ( function() {
        function build( t, params ) {
            params = $splat( params );

            return $extend( t, {
                easein:    function( pos ) {return t( pos, params );},
                easeout:   function( pos ) {return 1 - t( 1 - pos, params );},
                easeinout: function( pos ) {return ( pos <= 0.5 )? t( 2 * pos, params ) / 2 : ( 2 - t( 2 * ( 1 - pos ), params ) ) / 2;}
            } );
        };

        // return populated public interface
        return $extend( {
            linear: function( p ) {return p;},
            none:   function( p ) {return 0;},
            full:   function( p ) {return 1;}
        }, ( function() {
            var t = {};

            $each( {
                back:      function( p, x ) {x = x[0] || 1.618; return M.pow( p, 2 ) * ( ( x + 1 ) * p - x );},
                circ:      function( p    ) {return 1 - M.sin( M.acos( p ) );},
                cubic:     function( p    ) {return M.pow( p, 3 );},
                elastic:   function( p, x ) {return M.pow( 2, 10 * --p ) * M.cos( 20 * p * M.PI * ( x[0] || 1 ) / 3 );},
                expo:      function( p    ) {return M.pow( 2, 8 * ( p - 1 ) );},
                pow:       function( p, x ) {return M.pow( p, x[0] || 6 );},
                quadratic: function( p    ) {return M.pow( p, 2 );},
                quartetic: function( p    ) {return M.pow( p, 4 );},
                quintic:   function( p    ) {return M.pow( p, 5 );},
                sine:      function( p    ) {return 1 - M.sin( ( 1 - p ) * M.PI / 2 );},
                reverse:   function( p    ) {return 1 - p;},
                flicker:   function( p    ) {p = ( ( -M.cos( p * M.PI ) / 4 ) + .75 ) + M.random() / 4; return ( p > 1 )? 1 : p;},
                wobble:    function( p    ) {return ( -M.cos( p * M.PI * ( 9 * p ) ) / 2 ) + .5;},
                pulse:     function( p, c ) {return ( -M.cos( ( p * ( ( c[0] || 5 ) - .5 ) * 2 ) * M.PI ) / 2 ) + .5;},
                spring:    function( p    ) {return 1 - ( M.cos( p * 4.5 * M.PI ) * M.exp( -p * 6 ) );}
            }, function( v, k ) {
                t[k] = build( v );
            } );
            
            return t;
        } )() );
    } )();


    // Animation class

    var Animation = new Class( {
        initalize: function( options ) {
            this.options = $extend( {
                duration:   2500,
                fps:        40,
                transition: Transition.quartetic.easeinout,
                onBegin:    $empty,
                onCompute:  $empty,
                onComplete: $empty
            }, options || {} );
        },

        step: function() {
            var time = $time();

            if ( time < this.time + this.options.duration ) {
                var delta = this.options.transition( ( time - this.time ) / this.options.duration );
                this.options.onCompute( delta );
            } else {
                this.timer = window.clearInterval( this.timer );
                this.options.onCompute( 1 );
                this.options.onComplete();
            }
        },

        start: function() {
            this.time = 0;
            this.startTimer();

            return this;
        },

        startTimer: function() {
            if ( this.timer ) {
                return false;
            }

            var self = this;

            this.options.onBegin();
            this.time  = $time() - this.time;
            this.timer = window.setInterval( ( function() {
                self.step();
            } ), M.round( 1000 / this.options.fps ) );

            return true;
        }
    } );


    // Rotation preprocessor

    var Rot = ( function() {
        var sin = [];
        var cos = [];

        for ( var i = -360; i < 360; i++ ) {
            sin[i] = M.sin( i * DEG_TO_RAD );
            cos[i] = M.cos( i * DEG_TO_RAD );
        }

        return {
            s: function( i ) {return sin[$i( i )] || M.sin( i * DEG_TO_RAD );},
            c: function( i ) {return cos[$i( i )] || M.cos( i * DEG_TO_RAD );}
        };
    } )();


    // Vertex class

    $X = function( x, y ) {
        return new Vertex( x || 0, y || 0 );
    };

    var Vertex = new Class( {
        initialize: function( x, y ) {
            this.x = x;
            this.y = y;
        }
    } );

    $extend( Vertex, {
        triangulate: function( vertices ) {
            var i, triangle, triangles = [], st = Vertex.createBoundingTriangle( vertices );
            triangles.push( st );

            // begin the triangulation one vertex at a time
            for ( i in vertices ) {
                Vertex.add( vertices[i], triangles );
            }

            // remove triangles that shared edges with "supertriangle"
            for ( i in triangles ) {
                triangle = triangles[i];

                if ( ( triangle.v0 == st.v0 ) || ( triangle.v0 == st.v1 ) || ( triangle.v0 == st.v2 ) ||
                     ( triangle.v1 == st.v0 ) || ( triangle.v1 == st.v1 ) || ( triangle.v1 == st.v2 ) ||
                     ( triangle.v2 == st.v0 ) || ( triangle.v2 == st.v1 ) || ( triangle.v2 == st.v2 ) ) {
                    delete triangles[i];
                }
            }

            return triangles;
        },

        // create a triangle that bounds the given vertices, with room to spare
        createBoundingTriangle: function( vertices ) {
            var minx, miny, maxx, maxy, vertex;

            for ( var i in vertices ) {
                vertex = vertices[i];
        
                if ( ( $t( minx ) == 'undefined' ) || ( vertex.x < minx ) ) { minx = vertex.x; }
                if ( ( $t( miny ) == 'undefined' ) || ( vertex.y < miny ) ) { miny = vertex.y; }
                if ( ( $t( maxx ) == 'undefined' ) || ( vertex.x > maxx ) ) { maxx = vertex.x; }
                if ( ( $t( maxy ) == 'undefined' ) || ( vertex.y > maxy ) ) { maxy = vertex.y; }
            }

            var dx   = ( maxx - minx ) * 10;
            var dy   = ( maxy - miny ) * 10;
            var stv0 = $X( minx - dx,     miny - dy * 3 );
            var stv1 = $X( minx - dx,     maxy + dy     );
            var stv2 = $X( maxx + dx * 3, maxy + dy     );

            return $T( stv0, stv1, stv2 );   
        },

        // update triangulation with a vertex 
        add: function( vertex, triangles ) {
            var i, triangle, edge, edges = [];
    
            // remove triangles with circumcircles containing the vertex
            for ( i in triangles ) {
                triangle = triangles[i];

                if ( triangle.inCircumcircle( vertex ) ) {
                    edges.push( $E( triangle.v0, triangle.v1 ) );
                    edges.push( $E( triangle.v1, triangle.v2 ) );
                    edges.push( $E( triangle.v2, triangle.v0 ) );

                    delete triangles[i];
                }
            }

            edges = Edge.unique( edges );

            // create new triangles from the unique edges and new vertex
            for ( i in edges ) {
                edge = edges[i];
                triangles.push( $T( edge.v0, edge.v1, vertex ) );
            }
        }
    } );


    // Edge class

    $E = function( v0, v1 ) {
        return new Edge( v0, v1 );
    };

    var Edge = new Class( {
        initialize: function( v0, v1 ) {
            this.v0 = v0;
            this.v1 = v1;
        }
    } );

    $extend( Edge, {
        unique: function( edges ) {
            var edge1, edge2, unique, i, j, u = [];

            for ( i in edges ) {
                edge1  = edges[i];
                unique = true;

                for ( j in edges ) {
                    if ( i != j ) {
                        edge2 = edges[j];

                        if ( ( ( edge1.v0 == edge2.v0 ) && ( edge1.v1 == edge2.v1 ) ) || ( ( edge1.v0 == edge2.v1 ) && ( edge1.v1 == edge2.v0 ) ) ) {
                            unique = false;
                            break;
                        }
                    }
                }
        
                if ( unique ) {
                    u.push( edge1 );
                }
            }

            return u;
        }
    } );


    // Triangle class

    $T = function( v0, v1, v2 ) {
        return new Triangle( v0, v1, v2 );
    };

    var Triangle = new Class( {
        initialize: function( v0, v1, v2 ) {
            this.v0 = v0;
            this.v1 = v1;
            this.v2 = v2;

            ( function() {
                var a = this.v1.x - this.v0.x;
                var b = this.v1.y - this.v0.y;
                var c = this.v2.x - this.v0.x;
                var d = this.v2.y - this.v0.y;
                var e = a * ( this.v0.x + this.v1.x ) + b * ( this.v0.y + this.v1.y );
                var f = c * ( this.v0.x + this.v2.x ) + d * ( this.v0.y + this.v2.y );
                var g = 2.0 * ( a * ( this.v2.y - this.v1.y ) - b * ( this.v2.x - this.v1.x ) );
                var dx, dy;
    
                // collinear - find extremes and use the midpoint
                if ( M.abs( g ) < PRECISION ) {
                    function max3( a, b, c ) {
                        return ( ( a >= b ) && ( a >= c ) )? a : ( ( b >= a ) && ( b >= c ) )? b : c;
                    }

                    function min3( a, b, c ) {
                        return ( ( a <= b ) && ( a <= c ) )? a : ( ( b <= a ) && ( b <= c ) )? b : c;
                    }

                    var minx = min3( this.v0.x, this.v1.x, this.v2.x );
                    var miny = min3( this.v0.y, this.v1.y, this.v2.y );
                    var maxx = max3( this.v0.x, this.v1.x, this.v2.x );
                    var maxy = max3( this.v0.y, this.v1.y, this.v2.y );

                    this.center = $X( ( minx + maxx ) / 2, ( miny + maxy ) / 2 );

                    dx = this.center.x - minx;
                    dy = this.center.y - miny;
                } else {
                    var cx = ( d * e - b * f ) / g; 
                    var cy = ( a * f - c * e ) / g;

                    this.center = $X( cx, cy );

                    dx = this.center.x - this.v0.x;
                    dy = this.center.y - this.v0.y;
                }

                this.radius_squared = dx * dx + dy * dy;
                this.radius = M.sqrt( this.radius_squared );
            }.$bind( this ) )();
        },

        inCircumcircle: function( v ) {
            var dx = this.center.x - v.x;
            var dy = this.center.y - v.y;

            return ( dx * dx + dy * dy <= this.radius_squared );
        }
    } );


    // Vector class

    $V = function( els ) {
        return new Vector( els );
    };

    var Vector = new Class( {
        initialize: function( els ) {
            this.setElements( els );
        },

        setElements: function( els ) {
            this.elms = ( els.elms || els ).slice();
            return this;
        },

        asCoordinate: function() {
            return ( this.size == 3 )? $C( this.elms[0], this.elms[1], this.elms[2] ) : false;
        },

        at: function( i ) {
            return ( ( i < 1 ) || ( i > this.elms.length ) )? null : this.elms[i - 1];
        },

        size: function() {
            return this.elms.length;
        },

        modulus: function() {
            return M.sqrt( this.dot( this ) );
        },

        equals: function( vc ) {
            var n = this.size();
            var v = vc.elms || vc;
    
            if ( n != v.length ) {
                return false;
            }

            do {
                if ( M.abs( this.elms[n - 1] - v[n - 1] ) > PRECISION ) {
                    return false;
                }
            } while ( --n );

            return true;
        },

        clone: function() {
            return $V( this.elms );
        },

        // maps the vector to another vector according to the given function
        map: function( fn ) {
            var elms = [];

            this.each( function( x, i ) {
                elms.push( fn( x, i ) );
            } );

            return $V( elms );
        },

        each: function( fn ) {
            var n = this.size(), k = n, i;

            do {
                i = k - n;
                fn( this.elms[i], i + 1 );
            } while ( --n );
        },

        // returns a new vector created by normalizing the receiver
        toUnitVector: function() {
            var r = this.modulus();

            if ( r === 0 ) {
                return this.clone();
            }

            return this.map( function( x ) {
                return x / r;
            } );
        },

        angleFrom: function( vc ) {
            var v = vc.elms || vc;
            var n = this.size(), k = n, i;

            if ( n != v.length ) {
                return null;
            }

            var dot = 0, mod1 = 0, mod2 = 0;
            this.each( function( x, i ) {
                dot  += x * v[i - 1];
                mod1 += x * x;
                mod2 += v[i - 1] * v[i - 1];
            } );

            mod1 = M.sqrt( mod1 );
            mod2 = M.sqrt( mod2 );

            if ( mod1 * mod2 === 0 ) {
                return null;
            }
    
            return M.acos( $bound( dot / (mod1 * mod2 ), -1, 1 ) );
        },

        isParallelTo: function( vc ) {
            var angle = this.angleFrom( vc );
            return ( angle === null )? null : ( angle <= PRECISION );
        },

        isAntiparallelTo: function( vc ) {
            var angle = this.angleFrom( vc );
            return ( angle === null )? null : ( M.abs( angle - M.PI ) <= PRECISION );
        },

        isPerpendicularTo: function( vc ) {
            var dot = this.dot( vc );
            return ( dot === null )? null : ( M.abs( dot ) <= PRECISION );
        },

        add: function( vc ) {
            var v = vc.elms || vc;

            if ( this.size() != v.length ) {
                return null;
            }

            return this.map( function( x, i ) {
                return x + v[i - 1];
            } );
        },

        subtract: function( vc ) {
            var v = vc.elms || vc;
    
            if ( this.size() != v.length ) {
                return null;
            }

            return this.map( function( x, i ) {
                return x - v[i - 1];
            } );
        },

        multiply: function( k ) {
            return this.map( function( x ) {
                return x * ( k || x );
            } );
        },

        divide: function( k ) {
            return this.map( function( x ) {
                return x / ( k || x );
            } );
        },

        // returns the scalar product of the vector with the argument, both vectors must have equal dimensionality
        dot: function( vc ) {
            var v = vc.elms || vc;
            var i, product = 0, n = this.size();
    
            if ( n != v.length ) {
                return null;
            }
    
            do {
                product += this.elms[n - 1] * v[n - 1];
            } while ( --n );

            return product;
        },

        // returns the vector product of the vector with the argument, both vectors must have dimensionality 3
        cross: function( vc ) {
            var v = vc.elms || vc;

            if ( ( this.size() != 3 ) || ( v.length != 3 ) ) {
                return null;
            }

            return $V( [
                ( this.elms[1] * v[2] ) - ( this.elms[2] * v[1] ),
                ( this.elms[2] * v[0] ) - ( this.elms[0] * v[2] ),
                ( this.elms[0] * v[1] ) - ( this.elms[1] * v[0] )
            ] );
        },

        max: function() {
            var m = 0, n = this.size(), k = n, i;

            do {
                i = k - n;
      
                if ( M.abs( this.elms[i] ) > M.abs( m ) ) {
                    m = this.elms[i];
                }
            } while ( --n );
    
            return m;
        },

        indexOf: function( x ) {
            var index = null, n = this.size(), k = n, i;
    
            do {
                i = k - n;
      
                if ( ( index === null ) && ( this.elms[i] == x ) ) {
                    index = i + 1;
                }
            } while ( --n );

            return index;
        },

        // returns a diagonal matrix with the vector's elements as its diagonal elements
        toDiagonalMatrix: function() {
            return Matrix.diagonal( this.elms );
        },

        // returns the result of rounding the elements of the vector
        round: function() {
            return this.map( function( x ) {
                return M.round( x );
            } );
        },

        // returns a copy of the vector with elements set to the given value if they differ from it by less than PRECISION
        snapTo: function( x ) {
            return this.map( function( y ) {
                return ( M.abs( y - x ) <= PRECISION )? x : y;
            } );
        },

        // returns the vector's distance from the argument, when considered as a point in space
        distanceFrom: function( obj ) {
            if ( obj.anchor ) {
                return obj.distanceFrom( this );
            }

            var v = obj.elms || obj;

            if ( v.length != this.size() ) {
                return null;
            }

            var sum = 0, part;
            this.each( function( x, i ) {
                part = x - v[i - 1];
                sum += part * part;
            } );
    
            return M.sqrt( sum );
        },

        isOn: function( line ) {
            return line.contains( this );
        },

        isIn: function( plane ) {
            return plane.contains( this );
        },

        // rotates the vector about the given object, the object should be a point if the vector is 2D, and a line if it is 3D
        rotate: function( t, obj ) {
            var v, r, c, x, y, z;
    
            if ( ![2, 3].$in( this.size() ) ) {
                return null;
            }

            if ( this.size() == 2 ) {
                v = obj.elms || obj;
        
                if ( v.length != 2 ) {
                    return null;
                }
        
                r = Matrix.rotate( t ).elms;
                x = this.elms[0] - v[0];
                y = this.elms[1] - v[1];
        
                return $V( [
                    v[0] + r[0][0] * x + r[0][1] * y,
                    v[1] + r[1][0] * x + r[1][1] * y
                ] );
            } else {
                if ( !obj.direction ) {
                    return null;
                }

                c = obj.pointClosestTo( this ).elms;
                r = Matrix.rotate( t, obj.direction ).elms;
                x = this.elms[0] - c[0];
                y = this.elms[1] - c[1];
                z = this.elms[2] - c[2];
        
                return $V( [
                    c[0] + r[0][0] * x + r[0][1] * y + r[0][2] * z,
                    c[1] + r[1][0] * x + r[1][1] * y + r[1][2] * z,
                    c[2] + r[2][0] * x + r[2][1] * y + r[2][2] * z
                ] );
            }
        },

        // returns the result of reflecting the point in the given point, line or plane
        reflectionIn: function( obj ) {
            // plane or line
            if ( obj.anchor ) {
                var p = this.elms.slice();
                var c = obj.pointClosestTo( P ).elms;
      
                return $V( [c[0] + ( c[0] - p[0] ), c[1] + ( c[1] - p[1] ), c[2] + ( c[2] - ( p[2] || 0 ) )] );
            } 
            // point
            else {
                var q = obj.elms || obj;

                if ( this.size() != q.length ) {
                    return null;
                }
      
                return this.map( function( x, i ) {
                    return q[i - 1] + ( q[i - 1] - x );
                } );
            }
        },

        to3D: function() {
            var v = this.clone(), n = v.size();
    
            if ( ![2, 3].$in( n ) ) {
                return null;
            }

            if ( n == 2 ) {
                v.elms.push( 0 );
            }

            return v;
          }
    } );

    $extend( Vector, {
        // unit vectors
        i: $V( [1, 0, 0] ),
        j: $V( [0, 1, 0] ),
        k: $V( [0, 0, 1] ),

        zero: function( n ) {
            return $V( [].$fill( n, 0 ) );
        }
    } );


    // Coordinate class - basically a leightweight Vector for Coordinate Storage

    $C = function( x, y, z ) {
        return new Coordinate( x || 0, y || 0, z || 0 );
    };

    var Coordinate = new Class( {
        initialize: function( x, y, z ) {
            this.set( x, y, z );
        },

        zero: function() {
            this.set( 0, 0, 0 );
        },

        clone: function() {
            return $C( this.x, this.y, this.z );
        },

        asVector: function() {
            return $V( [this.x, this.y, this.z] );
        },

        set: function( x, y, z ) {
            this.x = x;
            this.y = y;
            this.z = z;

            return this;
        },

        copyFrom: function( v ) {
            this.x = v.x;
            this.y = v.y;
            this.z = v.z;

            return this;
        },

        add: function( v ) {
            switch ( arguments.length ) {
                case 1:
                    var a = arguments[0];

                    if ( a.elms && ( a.size() === 3 ) ) {
                        this.x += a.elms[0];
                        this.y += a.elms[1];
                        this.z += a.elms[2];
                    } else {
                        this.x += a.x;
                        this.y += a.y;
                        this.z += a.z;
                    }

                    break;

                case 3:
                    this.x += arguments[0];
                    this.y += arguments[1];
                    this.z += arguments[2];

                    break;
            }

            return this;
        },

        sub: function( v ) {
            switch ( arguments.length ) {
                case 1:
                    var a = arguments[0];

                    if ( a.elms && ( a.size() === 3 ) ) {
                        this.x -= a.elms[0];
                        this.y -= a.elms[1];
                        this.z -= a.elms[2];
                    } else {
                        this.x -= a.x;
                        this.y -= a.y;
                        this.z -= a.z;
                    }

                    break;

                case 3:
                    this.x -= arguments[0];
                    this.y -= arguments[1];
                    this.z -= arguments[2];

                    break;
            }

            return this;
        },

        zoom: function( f ) {
            this.x *= f;
            this.y *= f;
            this.z *= f;

            return this;
        },

        divide: function( f ) {
            this.x /= f;
            this.y /= f;
            this.z /= f;

            return this;
        },

        normalize: function() {
            var l = this.x * this.x + this.y * this.y + this.z * this.z;

            if ( l > 0.0 ) {
                l = M.sqrt( l );

                this.x /= l;
                this.y /= l;
                this.z /= l;
            } else {
                this.x  = 1.0;
            }

            return this;
        },

        toString: function() {
            return [this.x, this.y, this.z].join( ', ' );
        }
    } );


    // Matrix class

    $M = function( els ) {
        return new Matrix( els );
    };

    var Matrix = new Class( {
        initialize: function( els ) {
            this.setElements( els );
        },

        setElements: function( els ) {
            var i, elms = els.elms || els;
    
            if ( $t( elms[0][0] ) != 'undefined' ) {
                var ni = elms.length, ki = ni, nj, kj, j;
                this.elms = [];
      
                do { 
                    i  = ki - ni;
                    nj = elms[i].length;
                    kj = nj;
        
                    this.elms[i] = [];
        
                    do {
                        j = kj - nj;
                      this.elms[i][j] = elms[i][j];
                    } while ( --nj );
                } while( --ni );
      
                return this;
            }
    
            var n = elms.length, k = n;
            this.elms = [];
    
            do {
                i = k - n;
                this.elms.push( [elms[i]] );
            } while ( --n );
    
            return this;
        },

        at: function( i, j ) {
            if ( ( i < 1 ) || ( i > this.elms.length ) || ( j < 1 ) || ( j > this.elms[0].length ) ) { 
                return null;
            }
    
            return this.elms[i - 1][j - 1];
        },

        row: function( i ) {
            if ( i > this.elms.length ) {
                return null;
            }
    
            return $V( this.elms[i - 1] );
        },

        col: function( j ) {
            if ( j > this.elms[0].length ) {
                return null;
            }
    
            var col = [], n = this.rows(), k = n, i;
    
            do {
                i = k - n;
                col.push( this.elms[i][j - 1] );
            } while ( --n );
    
            return $V( col );
        },

        size: function() {
            return {
                rows: this.rows(),
                cols: this.cols()
            };
        },

        rows: function() {
            return this.elms.length;
        },

        cols: function() {
            return this.elms[0].length;
        },

        equals: function( matrix ) {
            var m = matrix.elms || matrix;
    
            if ( $t( m[0][0] ) == 'undefined' ) {
                m = $M( m ).elms;
            }

            var r = this.rows();
            var c = this.cols();
    
            if ( ( r != m.length ) || ( c != m[0].length ) ) {
                return false;
            }
    
            var ni = r, ki = ni, i, nj, kj = c, j;
    
            do {
                i = ki - ni, nj = kj;
      
                do {
                    j = kj - nj;
        
                    if ( M.abs( this.elms[i][j] - m[i][j] ) > PRECISION ) {
                        return false;
                    }
                } while ( --nj );
            } while ( --ni );

            return true;
        },

        clone: function() {
            return $M( this.elms );
        },

        map: function( fn ) {
            var els = [], ni = this.rows(), ki = ni, i, nj, kj = this.cols(), j;
    
            do {
                i  = ki - ni;
                nj = kj;
                els[i] = [];
      
                do {
                    j = kj - nj;
                    els[i][j] = fn( this.elms[i][j], i + 1, j + 1 );
                } while ( --nj );
            } while ( --ni );

            return $M( els );
        },

        ofSameSize: function( matrix ) {
            var m = matrix.elms || matrix;
    
            if ( $t( m[0][0] ) == 'undefined' ) {
                m = $M( m ).elms;
            }
    
            return ( ( this.rows() == m.length ) && ( this.cols() == m[0].length ) );
        },

        add: function( matrix ) {
            var m = matrix.elms || matrix;
    
            if ( $t( m[0][0] ) == 'undefined' ) {
                m = $M( m ).elms;
            }
    
            if ( !this.ofSameSize( m ) ) {
                return null;
            }
    
            return this.map( function( x, i, j ) {
                return x + m[i - 1][j - 1];
            } );
        },

        subtract: function( matrix ) {
            var m = matrix.elms || matrix;

            if ( $t( m[0][0] ) == 'undefined' ) {
                m = $M( m ).elms;
            }
    
            if ( !this.ofSameSize( m ) ) {
                return null;
            }
    
            return this.map( function( x, i, j ) {
                return x - m[i - 1][j - 1];
            } );
        },

        // returns true if the matrix can multiply the argument from the left
        canMultiplyFromLeft: function( matrix ) {
            var m = matrix.elms || matrix;
    
            if ( $t( m[0][0] ) == 'undefined' ) {
                m = $M( m ).elms;
            }

            return ( this.cols() == m.length );
        },

        multiply: function( matrix ) {
            if ( !matrix.elms ) {
                return this.map( function( x ) {
                    return x * matrix;
                } );
            }
    
            var ret_v = !!matrix.modulus;
            var m = matrix.elms || matrix;
    
            if ( $t( m[0][0] ) == 'undefined' ) {
                m = $M( m ).elms;
            }
    
            if ( !this.canMultiplyFromLeft( m ) ) {
                return null;
            }
    
            var ni = this.rows(), ki = ni, kj = m[0].length, cols = this.cols(), elms = [], sum, nc, c, i, nj, j;
    
            do {
                i = ki - ni, nj = k;
                elms[i] = [];

                do {
                    j = kj - nj, sum = 0, nc = cols;
        
                    do {
                        c = cols - nc;
                        sum += this.elms[i][c] * m[c][j];
                    } while ( --nc );
        
                    elms[i][j] = sum;
                } while ( --nj );
            } while ( --ni );
    
            m = $M( elms );
            return ret_v? m.col( 1 ) : m;
        },

        minor: function( a, b, c, d ) {
            var elms = [], ni = c, s = this.size(), i, nj, j;

            do {
                i = c - ni, nj = d;
                elms[i] = [];
      
                do {
                    j = d - nj;
                    elms[i][j] = this.elms[( a + i - 1 ) % s.rows][( b + j - 1 ) % s.cols];
                } while ( --nj );
            } while ( --ni );
    
            return $M( elms );
        },

        transpose: function() {
            var s = this.size(), elms = [], ni = s.cols, i, nj, j;
    
            do {
                i = s.cols - ni, nj = s.rows;
                elms[i] = [];
      
                do {
                    j = s.rows - nj;
                    elms[i][j] = this.elms[j][i];
                } while ( --nj );
            } while ( --ni );

            return $M( elms );
        },

        isSquare: function() {
            return ( this.rows() == this.cols() );
        },

        max: function() {
            var m = 0, s = this.size(), ni = s.rows, ki = ni, i, nj, kj = s.cols, j;
    
            do {
                i = ki - ni, nj = kj;
      
                do {
                    j = kj - nj;
        
                    if ( M.abs( this.elms[i][j] ) > M.abs( m ) ) {
                        m = this.elms[i][j];
                    }
                } while ( --nj );
            } while ( --ni );
            
            return m;
        },

        // returns the indices of the first match found by reading row-by-row from left to right
        indexOf: function( x ) {
            var index = null, s = this.size(), ni = s.rows, ki = ni, i, nj, kj = s.cols, j;
    
            do {
                i = ki - ni, nj = kj;
              
                do {
                    j = kj - nj;
        
                    if ( this.elms[i][j] == x ) {
                        return {
                            i: i + 1,
                            j: j + 1
                        };
                    }
                } while ( --nj );
            } while ( --ni );

            return null;
        },

        diagonal: function() {
            if ( !this.isSquare ) {
                return null;
            }
    
            var els = [], n = this.rows(), k = n, i;
    
            do {
                i = k - n;
                els.push( this.elms[i][i] );
            } while ( --n );
    
            return $V( els );
        },

        // make the matrix right(/upper) triangular by gaussian elimination
        toRightTriangular: function() {
            var m = this.clone(), n = this.rows(), k = n, kp = this.cols(), p, els, i, np, mult;
    
            do {
                i = k - n;
      
                if ( m.elms[i][i] == 0 ) {
                    for ( j = i + 1; j < k; j++ ) {
                        if ( m.elms[j][i] != 0 ) {
                            els = []; np = kp;
            
                            do {
                                p = kp - np;
                                els.push( m.elms[i][p] + m.elms[j][p] );
                            } while ( --np );
            
                            m.elms[i] = els;
                            break;
                        }
                    }
                } else {
                    for ( j = i + 1; j < k; j++ ) {
                        mult = m.elms[j][i] / m.elms[i][i], els = []; np = kp;
          
                        do {
                            p = kp - np;
                            els.push( ( p <= i )? 0 : m.elms[j][p] - m.elms[i][p] * mult );
                        } while ( --np );
          
                        m.elms[j] = els;
                    }
                }
            } while ( --n );

            return m;
        },

        // returns the determinant for square matrices
        determinant: function() {
            if ( !this.isSquare() ) {
                return null;
            }

            var m = this.toRightTriangular(), det = m.elms[0][0], n = m.elms.length - 1, k = n, i;
    
            do {
                i   = k - n + 1;
                det = det * m.elms[i][i];
            } while ( --n );
    
            return det;
        },

        isSingular: function() {
            return ( this.isSquare() && ( this.determinant() === 0 ) );
        },

        trace: function() {
            if ( !this.isSquare() ) {
                return null;
            }
    
            var tr = this.elms[0][0], n = this.elms.length - 1, k = n, i;
    
            do {
                i   = k - n + 1;
                tr += this.elms[i][i];
            } while ( --n );
    
            return tr;
        },

        rank: function() {
            var m = this.toRightTriangular(), rank = 0, ni = this.rows(), ki = ni, i, nj, kj = this.cols(), j;
    
            do {
                i = ki - ni, nj = kj;
      
                do {
                    j = kj - nj;
        
                    if ( M.abs( m.elms[i][j] ) > PRECISION ) {
                        rank++;
                        break;
                    }
                } while ( --nj );
            } while ( --ni );
    
            return rank;
        },

        // returns the result of attaching the given argument to the right-hand side of the matrix
        augment: function( matrix ) {
            var m = matrix.elms || matrix;
    
            if ( $t( m[0][0] ) == 'undefined' ) {
                m = $M( m ).elms;
            }
    
            var t = this.clone(), cols = t.cols(), ni = t.rows(), ki = ni, i, j, nj, kj = m[0].length;
    
            if ( ni != m.length ) {
                return null;
            }
    
            do {
                i = ki - ni, nj = kj;
      
                do {
                    j = kj - nj;
                    t.elms[i][cols + j] = m[i][j];
                } while ( --nj );
            } while ( --ni );
    
            return t;
        },

        round: function() {
            return this.map( function( x ) {
                return M.round( x );
            } );
        },

        // returns a copy of the matrix with elements set to the given value if they differ from it by less than PRECISION
        snapTo: function( x ) {
            return this.map( function( p ) {
                return ( M.abs( p - x ) <= PRECISION )? x : p;
            } );
        },

        // returns the inverse (if one exists) using Gauss-Jordan
        inverse: function() {
            if ( !this.isSquare() || this.isSingular() ) {
                return null;
            }

            var ni = this.elms.length, ki = ni, i, j;
            var m  = this.augment( Matrix.identify( ni ) ).toRightTriangular();
            var kp = m.elms[0].length, inv_elms = [], p, els, div, new_elm, np;

            do {
                i = ni - 1, els = []; np = kp, inv_elms[i] = [], div = m.elms[i][i];

                do {
                    p = kp - np, new_elm = m.elms[i][p] / div;
                    els.push( new_elm );

                    if ( p >= ki ) {
                        inv_elms[i].push( new_elm );
                    }
                } while ( --np );
      
                m.elms[i] = els;

                for ( j = 0; j < i; j++ ) {
                    els = []; np = kp;
        
                    do {
                        p = kp - np;
                        els.push( m.elms[j][p] - m.elms[i][p] * m.elms[j][i] );
                    } while ( --np );
        
                    m.elms[j] = els;
                }
            } while ( --ni );

            return $M( inv_elms );
        }
    } );

    $extend( Matrix, {
        zero: function( n, m ) {
            var els = [], ni = n, i, nj, j;
  
            do {
                i = n - ni, nj = m;
                els[i] = [];
    
                do {
                    j = m - nj;
                    els[i][j] = 0;
                } while ( --nj );
            } while ( --ni );

            return $M( els );
        },

        identify: function( n ) {
            var els = [], k = n, i, nj, j;
  
            do {
                i = k - n, nj = k;
                els[i] = [];
    
                do {
                    j = k - nj;
                    els[i][j] = ( i == j )? 1 : 0;
                } while ( --nj );
            } while ( --n );

            return $M( els );
        },

        diagonal: function( elms ) {
            var n = elms.length, k = n, i, m = Matrix.identify( n );

            do {
                i = k - n;
                m.elms[i][i] = elms[i];
            } while ( --n );
  
            return m;
        },

        // rotation matrix about some axis - if no axis is supplied, assume we're after a 2D transform (@see http://www.gamedev.net/reference/articles/article1199.asp)
        rotate: function( theta, a ) {
            if ( !a ) {
                return $M( [
                    [M.cos( theta ), -M.sin( theta )],
                    [M.sin( theta ),  M.cos( theta )]
                ] );
            }
  
            var axis = a.clone();
  
            if ( axis.elms.length != 3 ) {
                return null;
            }
  
            var md = axis.modulus();
            var x  = axis.elms[0] / md;
            var y  = axis.elms[1] / md;
            var z  = axis.elms[2] / md;
            var s  = M.sin( theta );
            var c  = M.cos( theta );
            var t  = 1 - c;

            return $M( [
                [t * x * x + c,     t * x * y - s * z, t * x * z + s * y],
                [t * x * y + s * z, t * y * y + c,     t * y * z - s * x],
                [t * x * z - s * y, t * y * z + s * x, t * z * z + c    ]
            ] );
        },

        rotateX: function( t ) {
            var c = M.cos( t ), s = M.sin( t );
            return $M( [[1, 0, 0], [0, c, -s], [0, s, c]] );
        },

        rotateY: function( t ) {
            var c = M.cos( t ), s = M.sin( t );
            return $M( [[c, 0, s], [0, 1, 0], [-s, 0, c]] );
        },

        rotateZ: function( t ) {
            var c = M.cos( t ), s = M.sin( t );
            return $M( [[c, -s, 0], [s, c, 0], [0, 0, 1]] );
        }
    } );


    // Line class

    $L = function( anchor, direction ) {
        return new Line( anchor, direction );
    };

    var Line = new Class( {
        initialize: function( anchor, direction ) {
            this.setVectors( anchor, direction );
        },

        setVectors: function( anchor, direction ) {
            anchor    = $V( anchor    );
            direction = $V( direction );

            if ( anchor.elms.length == 2 ) {
                anchor.elms.push( 0 );
            }
    
            if ( direction.elms.length == 2 ) {
                direction.elms.push( 0 );
            }
    
            if ( ( anchor.elms.length > 3 ) || ( direction.elms.length > 3 ) ) {
                return null;
            }
    
            var mod = direction.modulus();
    
            if ( mod === 0 ) {
                return null;
            }
    
            this.anchor    = anchor;
            this.direction = $V( [
                direction.elms[0] / mod,
                direction.elms[1] / mod,
                direction.elms[2] / mod
            ] );
    
            return this;
        },

        equals: function( line ) {
            return ( this.isParallelTo( line ) && this.contains( line.anchor ) );
        },

        // returns the result of translating the line by the given vector/array
        translate: function( vector ) {
            var v = vector.elms || vector;
            return $L( [this.anchor.elms[0] + v[0], this.anchor.elms[1] + v[1], this.anchor.elms[2] + ( v[2] || 0 )], this.direction );
        },

        isParallelTo: function( obj ) {
            if ( obj.normal ) {
                return obj.isParallelTo( this );
            }
    
            var theta = this.direction.angleFrom( obj.direction );
            return ( ( M.abs( theta ) <= PRECISION ) || ( M.abs( theta - M.PI ) <= PRECISION ) );
        },

        // returns the line's perpendicular distance from the argument, which can be a point, a line or a plane
        distanceFrom: function( obj ) {
            if ( obj.normal ) {
                return obj.distanceFrom( this );
            }
    
            // line
            if ( obj.direction ) {
                if ( this.isParallelTo( obj ) ) {
                    return this.distanceFrom( obj.anchor );
                }
      
                var n = this.direction.cross( obj.direction ).toUnitVector().elms;
                var a = this.anchor.elms;
                var b = obj.anchor.elms;
      
                return M.abs( ( a[0] - b[0] ) * n[0] + ( a[1] - b[1] ) * n[1] + ( a[2] - b[2] ) * n[2] );
            }
            // point
            else {
                var p     = obj.elms || obj;
                var a     = this.anchor.elms;
                var d     = this.direction.elms;
                var pa1   = p[0] - a[0];
                var pa2   = p[1] - a[1];
                var pa3   = ( p[2] || 0 ) - a[2];
                var modpa = M.sqrt( pa1 * pa1 + pa2 * pa2 + pa3 * pa3 );
      
                if ( modpa === 0 ) {
                    return 0;
                }

                // assumes direction vector is normalized
                var costh = ( pa1 * d[0] + pa2 * d[1] + pa3 * d[2] ) / modpa;
                var sin2  = 1 - costh * costh;
      
                return M.abs( modpa * M.sqrt( ( sin2 < 0 )? 0 : sin2 ) );
            }
        },

        contains: function( pt ) {
            var d = this.distanceFrom( pt );
            return ( ( d !== null ) && ( d <= PRECISION ) );
        },

        isIn: function( plane ) {
            return plane.contains( this );
        },

        intersects: function( obj ) {
            return obj.normal? obj.intersects( this ) : ( !this.isParallelTo( obj ) && ( this.distanceFrom( obj ) <= PRECISION ) );
        },

        // returns the unique intersection point with the argument, if one exists
        intersectionWith: function( obj ) {
            if ( obj.normal ) {
                return obj.intersectionWith( this );
            }
    
            if ( !this.intersects( obj ) ) {
                return null;
            }
    
            var p = this.anchor.elms;
            var x = this.direction.elms;
            var q = obj.anchor.elms;
            var y = obj.direction.elms;

            var psubq1   = p[0] - q[0];
            var psubq2   = p[1] - q[1];
            var psubq3   = p[2] - q[2];
            var x_qsub_p = - x[0] * psubq1 - x[1] * psubq2 - x[2] * psubq3;
            var y_psub_q =   y[0] * psubq1 + y[1] * psubq2 + y[2] * psubq3;
            var x_x      =   x[0] * x[0] + x[1] * x[1] + x[2] * x[2];
            var y_y      =   y[0] * y[0] + y[1] * y[1] + y[2] * y[2];
            var x_y      =   x[0] * y[0] + x[1] * y[1] + x[2] * y[2];
            var k        = ( x_qsub_p * y_y / x_x + x_y * y_psub_q ) / ( y_y - x_y * x_y );
    
            return $V( [p[0] + k * x[0], p[1] + k * x[1], p[2] + k * x[2]] );
        },

        // returns a copy of the line rotated by t radians about the given line
        rotate: function( t, line ) {
            // 2D
            if ( $t( line.direction ) == 'undefined' ) {
                line = $L( line.to3D(), Vector.k );
            }
    
            var r  = Matrix.rotate( t, line.direction ).elms;
            var c  = line.pointClosestTo( this.anchor ).elms;
            var a  = this.anchor.elms;
            var d  = this.direction.elms;
            var x  = a[0] - c[0];
            var y  = a[1] - c[1];
            var z  = a[2] - c[2];

            return $L( [
                c[0] + r[0][0] * x + r[0][1] * y + r[0][2] * z,
                c[1] + r[1][0] * x + r[1][1] * y + r[1][2] * z,
                c[2] + r[2][0] * x + r[2][1] * y + r[2][2] * z
            ], [
                r[0][0] * d[0] + r[0][1] * d[1] + r[0][2] * d[2],
                r[1][0] * d[0] + r[1][1] * d[1] + r[1][2] * d[2],
                r[2][0] * d[0] + r[2][1] * d[1] + r[2][2] * d[2]
            ] );
        },

        // returns the line's reflection in the given point or line
        reflectionIn: function( obj ) {
            // plane
            if ( obj.normal ) {
                var a     = this.anchor.elms;
                var d     = this.direction.elms;
                var new_a = this.anchor.reflectionIn( obj ).elms;
      
                // add the line's direction vector to its anchor, then mirror that in the plane
                var ad1   = a[0] + d[0];
                var ad2   = a[1] + d[1];
                var ad3   = a[2] + d[2];
                var q     = obj.pointClosestTo( [ad1, ad2, ad3] ).elms;
                var new_d = [q[0] + ( q[0] - ad1 ) - new_a[0], q[1] + ( q[1] - ad2 ) - new_a[1], q[2] + ( q[2] - ad3 ) - new_a[2]];
      
                return $L( new_a, new_d );
            }
            // line
            else if ( obj.direction ) {
                return this.rotate( M.PI, obj );
            }
            // point
            else {
                var p = obj.elms || obj;
                return $L( this.anchor.reflectionIn( [p[0], P[1], ( p[2] || 0 )] ), this.direction );
            }
        },

        // returns the point on the line that is closest to the given point or line
        pointClosestTo: function( obj ) {
            // line
            if ( obj.direction ) {
                if ( this.intersects( obj ) ) {
                    return this.intersectionWith( obj );
                }
      
                if ( this.isParallelTo( obj ) ) {
                    return null;
                }

                var d = this.direction.elms;
                var e = obj.direction.elms;
                var x = ( d[2] * e[0] - d[0] * e[2] );
                var y = ( d[0] * e[1] - d[1] * e[0] );
                var z = ( d[1] * e[2] - d[2] * e[1] );
                var n = $V( [x * e[2] - y * e[1], y * e[0] - z * e[2], z * e[1] - x * e[0]] );
                var p = $P( obj.anchor, n );
      
                return p.intersectionWith( this );
            }
            // point
            else {
                var p = obj.elms || obj;

                if ( this.contains( p ) ) {
                    return $V( p );
                }

                var a = this.anchor.elms;
                var d = this.direction.elms;
                var x = d[0] * ( p[1] - a[1] ) - d[1] * ( p[0] - a[0] );
                var y = d[1] * ( ( p[2] || 0 ) - a[2] ) - d[2] * ( p[1] - a[1] );
                var z = d[2] * ( p[0] - a[0] ) - d[0] * ( ( p[2] || 0 ) - a[2] );
                var v = $V( [d[1] * x - d[2] * z, d[2] * y - d[0] * x, d[0] * z - d[1] * y] );
                var k = this.distanceFrom( p ) / v.modulus();
      
                return $V( [p[0] + v.elms[0] * k, p[1] + v.elms[1] * k, ( p[2] || 0 ) + v.elms[2] * k] );
            }
        }
    } );

    $extend( Line, {
        // axes
        X: $L( Vector.zero( 3 ), Vector.i ),
        Y: $L( Vector.zero( 3 ), Vector.j ),
        Z: $L( Vector.zero( 3 ), Vector.k )
    } );


    // Plane class

    $P = function( anchor, v1, v2 ) {
        return new Plane( anchor, v1, v2 );
    };

    var Plane = new Class( {
        initialize: function( anchor, v1, v2 ) {
            this.setVectors( anchor, v1, v2 );
        },

        setVectors: function( a, v1, v2 ) {
            if ( ( a = $V( a ).to3D() ) === null ) {
                return null;
            }

            if ( ( v1 = $V( v1 ).to3D() ) === null ) {
                return null;
            }
    
            if ( $t( v2 ) == 'undefined' ) {
                v2 = null;
            } else {
                if ( ( v2 = $V( v2 ).to3D() ) === null ) {
                    return null;
                }
            }

            var n, mod;

            if ( v2 !== null ) {
                n = $V( [
                    ( v1.elms[1] - a.elms[1] ) * ( v2.elms[2] - a.elms[2] ) - ( v1.elms[2] - a.elms[2] ) * ( v2.elms[1] - a.elms[1] ),
                    ( v1.elms[2] - a.elms[2] ) * ( v2.elms[0] - a.elms[0] ) - ( v1.elms[0] - a.elms[0] ) * ( v2.elms[2] - a.elms[2] ),
                    ( v1.elms[0] - a.elms[0] ) * ( v2.elms[1] - a.elms[1] ) - ( v1.elms[1] - a.elms[1] ) * ( v2.elms[0] - a.elms[0] )
                ] );
      
                mod = n.modulus();
      
                if ( mod === 0 ) {
                    return null;
                }
      
                n = $V( [n.elms[0] / mod, n.elms[1] / mod, n.elms[2] / mod] );
            } else {
                mod = M.sqrt( v1.elms[0] * v1.elms[0] + v1.elms[1] * v1.elms[1] + v1.elms[2] * v1.elms[2] );
      
                if ( mod === 0 ) {
                    return null;
                }
      
                n = $V( [v1.elms[0] / mod, v1.elms[1] / mod, v1.elms[2] / mod] );
            }
    
            this.anchor = a;
            this.normal = n;
    
            return this;
        },

        // returns true if the plane occupies the same space as the argument
        equals: function( pl ) {
            return ( this.contains( pl.anchor) && this.isParallelTo( pl ) );
        },

        // returns the result of translating the plane by the given vector
        translate: function( vector ) {
            var v = vector.elms || vector;
    
            return $P( [this.anchor.elms[0] + v[0], this.anchor.elms[1] + v[1], this.anchor.elms[2] + ( v[2] || 0 )], this.normal );
        },

        isParallelTo: function( obj ) {
            // plane
            if ( obj.normal ) {
                var theta = this.normal.angleFrom( obj.normal );
                return ( ( M.abs( theta ) <= PRECISION ) || ( M.abs( M.PI - theta ) <= PRECISION ) );
            }
            // line
            else if ( obj.direction ) {
                return this.normal.isPerpendicularTo( obj.direction );
            }
    
            return null;
        },
  
        isPerpendicularTo: function( pl ) {
            var theta = this.normal.angleFrom( pl.normal );
            return ( M.abs( M.PI / 2 - theta ) <= PRECISION );
        },

        // returns the plane's distance from the given object (point, line or plane)
        distanceFrom: function( obj ) {
            if ( this.intersects( obj ) || this.contains( obj ) ) {
                return 0;
            }

            // plane or line
            if ( obj.anchor ) {
                var a = this.anchor.elms;
                var b = obj.anchor.elms;
                var n = this.normal.elms;
      
                return M.abs( ( a[0] - b[0] ) * n[0] + ( a[1] - b[1] ) * n[1] + ( a[2] - b[2] ) * n[2] );
            }
            // point
            else {
                var p = obj.elms || obj;
                var a = this.anchor.elms;
                var n = this.normal.elms;
      
                return M.abs( ( a[0] - p[0] ) * n[0] + ( a[1] - p[1] ) * n[1] + ( a[2] - (p[2] || 0 ) ) * n[2] );
            }
        },

        contains: function( obj ) {
            if ( obj.normal ) {
                return null;
            }
    
            if ( obj.direction ) {
                return ( this.contains( obj.anchor ) && this.contains( obj.anchor.add( obj.direction ) ) );
            } else {
                var p    = obj.elms || obj;
                var a    = this.anchor.elms;
                var n    = this.normal.elms;
                var diff = M.abs( n[0] * ( a[0] - p[0] ) + n[1] * ( a[1] - p[1] ) + n[2] * ( a[2] - ( p[2] || 0 ) ) );
      
                return ( diff <= PRECISION );
            }
        },

        intersects: function( obj ) {
            if ( ( $t( obj.direction ) == 'undefined' ) && ( $t( obj.normal ) == 'undefined' ) ) {
                return null;
            }
    
            return !this.isParallelTo( obj );
        },

        intersectionWith: function( obj ) {
            if ( !this.intersects( obj ) ) {
                return null;
            }

            // line
            if ( obj.direction ) {
                var a = obj.anchor.elms;
                var d = obj.direction.elms;
                var p = this.anchor.elms;
                var n = this.normal.elms;

                var mult = ( n[0] * ( p[0] - a[0] ) + n[1] * ( p[1] - a[1] ) + n[2] * ( p[2] - a[2] ) ) / ( n[0] * d[0] + n[1] * d[1] + n[2] * d[2] );
                return $V( [a[0] + d[0] * mult, a[1] + d[1] * mult, a[2] + d[2] * mult] );
            }
            // plane
            else if ( obj.normal ) {
                var d = this.normal.cross( obj.normal ).toUnitVector();
                var n = this.normal.elms;
                var a = this.anchor.elms;
                var o = obj.normal.elms;
                var b = obj.anchor.elms;
                var s = Matrix.zero( 2, 2 )

                var i = 0;
                while ( s.isSingular() ) {
                    i++;
                    s = $M( [[n[i % 3], n[( i + 1 ) % 3]], [o[i % 3], o[( i + 1 ) % 3]]] );
                }

                var inv = s.inverse().elms;
                var x   = n[0] * a[0] + n[1] * a[1] + n[2] * a[2];
                var y   = o[0] * b[0] + o[1] * b[1] + o[2] * b[2];
                var its = [inv[0][0] * x + inv[0][1] * y, inv[1][0] * x + inv[1][1] * y];
                var an  = [];
      
                for ( var j = 1; j <= 3; j++ ) {
                    an.push( ( i == j )? 0 : its[( j + ( 5 - i ) % 3 ) % 3] );
                }
      
                return $L( an, d );
            }
        },

        pointClosestTo: function( pt ) {
            var p   = pt || pt;
            var a   = this.anchor.elms;
            var n   = this.normal.elms;
            var dot = ( a[0] - p[0] ) * n[0] + ( a[1] - p[1] ) * n[1] + ( a[2] - ( p[2] || 0 ) ) * n[2];

            return $V( [p[0] + n[0] * dot, p[1] + n[1] * dot, ( p[2] || 0 ) + n[2] * dot] );
        },

        // returns a copy of the plane, rotated by t radians about the given line
        rotate: function( t, line ) {
            var r = Matrix.rotate( t, line.direction ).elms;
            var c = line.pointClosestTo( this.anchor ).elms;
            var a = this.anchor.elms;
            var n = this.normal.elms;
            var x = a[0] - c[0];
            var y = a[1] - c[1];
            var z = a[2] - c[2];

            return $P( [
                c[0] + r[0][0] * x + r[0][1] * y + r[0][2] * z,
                c[1] + r[1][0] * x + r[1][1] * y + r[1][2] * z,
                c[2] + r[2][0] * x + r[2][1] * y + r[2][2] * z
            ], [
                r[0][0] * n[0] + r[0][1] * n[1] + r[0][2] * n[2],
                r[1][0] * n[0] + r[1][1] * n[1] + r[1][2] * n[2],
                r[2][0] * n[0] + r[2][1] * n[1] + r[2][2] * n[2]
            ] );
        },

        // returns the reflection of the plane in the given point, line or plane
        reflectionIn: function( obj ) {
            // plane
            if ( obj.normal ) {
                var a     = this.anchor.elms;
                var n     = this.normal.elms;
                var new_a = this.anchor.reflectionIn( obj ).elms;
                var an1   = a[0] + n[0];
                var an2   = a[1] + n[1];
                var an3   = a[2] + n[2];
                var q     = obj.pointClosestTo( [an1, an2, an3] ).elms;
                var new_n = [q[0] + ( q[0] - an1 ) - new_a[0], q[1] + ( q[1] - an2 ) - new_a[1], q[2] + ( q[2] - an3 ) - new_a[2]];
      
                return $P( new_a, new_n );
            }
            // line
            else if ( obj.direction ) {
                return this.rotate( M.PI, obj );
            }
            // point
            else {
                var p = obj.elms || obj;
                return $P( this.anchor.reflectionIn( [p[0], p[1], ( p[2] || 0 )] ), this.normal );
            }
        }
    } );

    $extend( Plane, {
        XY: $P( Vector.zero( 3 ), Vector.k ),
        YZ: $P( Vector.zero( 3 ), Vector.i ),
        ZX: $P( Vector.zero( 3 ), Vector.j )
    } );


    // Scene class

    var Scene = new Class( {
        initialize: function( id, z, options ) {
            if ( !Client.isCapable ) {
                return;
            }
    
            this.options = $extend( {
                width:  500,
                height: 500
            }, options || {} );

            this.id = id || SCENE_ID_PREFIX + Scene.ID_COUNT++;

            // create fallback if canvas is not in place
            if ( !$( this.id ) ) {
                var div = _d.createElement( 'div' );
                div.id  = this.id;

                with ( div.style ) {
                    position = 'relative';
                    overflow = 'hidden';
                    width    = this.options.width;
                    height   = this.options.height;
                }

                $append( div, _d.getElementsByTagName( 'body' )[0] );
            }

            this.parent = this.scene = $( this.id );

            this.w = this.parent.style.width;
            this.h = this.parent.style.height;

            if ( Client.hasSVG ) {
                var doc;
                $append( doc = $c( 'svg', {
                    viewBox: '0 0 ' + $i( this.w ) + ' ' + $i( this.h ),
                    width:   this.w,
                    height:  this.h
                } ), this.parent );

                $append( this.scene = $c( 'g' ), doc );
            }
            
            this.poly          = [];
            this.poly_rank     = [];
            this.shapes        = [];
            this.zindex        = z || 1;
            this.center        = $C( 0.0, 0.0, 0.0 );
            this.zoom          = $C( 1.0, 1.0, 1.0 );
            this.order_weight  = $C( 1.0, 1.0, 1.0 );
            this.zoom_all      = 1.0;
            this.shift_x       = 0.0;
            this.shift_y       = 0.0;
            this.xm            = $i( this.w ) / 2;
            this.ym            = $i( this.h ) / 2;
            this.distance      = 1000.0;
            this.viewer        = $C( 1000.0, 0.0, 0.0 );
            this.light         = $C( 1.0, 0.0, 0.0 );
            this.light_th      = 0.0;
            this.light_fi      = 0.0;
            this.th            = 0.0;
            this.fi            = 0.0;
            this.diffuse       = 0.5;
            this.sin_th        = 0.0;
            this.cos_th        = 1.0;
            this.sin_fi        = 0.0;
            this.cos_fi        = 1.0;
            this.cos_fi_sin_th = 0.0;
            this.sin_fi_sin_th = 0.0;
            this.cos_fi_cos_th = 1.0;
            this.sin_fi_cos_th = 0.0;
            this.callbacks     = [];

            this.box           = null;
            this.navigator     = null;

            this.create();
        },

        create: function() {
            this.box_group  = null;
            this.poly_group = null;

            if ( Client.hasVML ) {
                var attrs = {
                    coordorigin: '0 0',
                    coordsize:   $i( this.xm * 2 ) + ' ' + $i( this.ym * 2 )
                };

                var styles = {
                    position:    'absolute',
                    top:         0,
                    left:        0,
                    width:       $i( this.xm * 2 ),
                    height:      $i( this.ym * 2 )
                };

                $append( this.box_group  = $c( 'g', attrs, styles ), this.scene );
                $append( this.poly_group = $c( 'g', attrs, styles ), this.scene );
            }

            return this;
        },

        getShapes: function() {
            return this.shapes;
        },

        setBoundingBox: function( b, options ) {
            if ( $t( b ) == 'function' ) {
                this.box = new b( this, options || {} );
            }

            return this.box;
        },

        setNavigator: function( n, options ) {
            if ( $t( n ) == 'function' ) {
                this.navigator = new n( this, options || {} );
            }

            return this.navigator;
        },

        changeView: function( th, fi ) {
            if ( this.box && this.box.restricted) {
                if ( ( this.th + th >= -89.0 ) && ( this.th + th <= 89.0 ) ) {
                    this.th += th;
                }
            } else {
                this.th += th % 89.0;
            }

            this.fi += fi;
            while ( this.fi  <   0.0 ) this.fi += 360.0;
            while ( this.fi >= 360.0 ) this.fi -= 360.0;

            this.sin_th = Rot.s( this.th );
            this.cos_th = Rot.c( this.th );
            this.sin_fi = Rot.s( this.fi );
            this.cos_fi = Rot.c( this.fi );

            this.cos_fi_sin_th = this.cos_fi * this.sin_th;
            this.sin_fi_sin_th = this.sin_fi * this.sin_th;
            this.cos_fi_cos_th = this.cos_fi * this.cos_th;
            this.sin_fi_cos_th = this.sin_fi * this.cos_th;

            this.viewer.set( this.center.x + this.cos_fi_cos_th * this.distance, this.center.y - this.sin_fi_cos_th * this.distance, this.center.z - this.sin_th * this.distance );
            return this;
        },

        changeLight: function( th, fi ) {
            if ( this.box && this.box.restricted ) {
                if ( ( this.light_th + th >= -89.0 ) && ( this.light_th + th <= 89.0 ) ) {
                    this.light_th += th;
                }
            } else {
                this.light_th += th % 89.0;
            }

            this.light_fi += fi;
            while ( this.light_fi  <   0.0 ) this.light_fi += 360.0;
            while ( this.light_fi >= 360.0 ) this.light_fi -= 360.0;

            this.light.set( Rot.c( this.light_fi ) * Rot.c( this.light_th ), -Rot.s( this.light_fi ) * Rot.c( this.light_th ), -Rot.s( this.light_th ) );
            return this;
        },

        addPoly: function( o ) {
            var l = this.poly.length;

            this.poly[l]      = o;
            this.poly_rank[l] = new Array( l, 0 );

            var styles = {
                zIndex: this.zindex + l + 3 // reserve 0-2 for box
            };

            if ( Client.hasVML ) {
                styles = $extend( styles, {
                    position: 'absolute',
                    left:     0,
                    top:      0,
                    width:    this.poly_group.style.width,
                    height:   this.poly_group.style.height
                } );
            }

            $append( this.shapes[l] = $c( 'path', null, styles ), Client.hasSVG? this.scene : this.poly_group );
            return this;
        },

        centerAuto: function() {
            var i, j, v, l = this.poly.length;
      
            this.center.zoom( 0.0 );

            for ( i = 0; i < l; i++ ) {
                this.center.add( this.poly[i].center );
            }

            if ( l > 0 ) {
                this.center.zoom( 1.0 / l );
            }

            var xmin = this.center.x;
            var xmax = this.center.x;
            var ymin = this.center.y;
            var ymax = this.center.y;
            var zmin = this.center.z;
            var zmax = this.center.z;

            for ( i = 0; i < l; i++ ) {
                for ( j = 0; j < this.poly[i].point.length; j++ ) {
                    v = this.poly[i].point[j];

                    if ( xmin > v.x ) xmin = v.x;
                    if ( xmax < v.x ) xmax = v.x;
                    if ( ymin > v.y ) ymin = v.y;
                    if ( ymax < v.y ) ymax = v.y;
                    if ( zmin > v.z ) zmin = v.z;
                    if ( zmax < v.z ) zmax = v.z;
                }
            }

            xmax -= xmin;
            ymax -= ymin;
            zmax -= zmin;
            v     = xmax * xmax + ymax * ymax + zmax * zmax;
            l     = ( v > 0.0 )? M.sqrt( v ) : 19.0;

            this.zoom_all = 1.6 * ( ( this.xm < this.ym )? this.xm : this.ym ) / l
            this.distance = 2 * l;
  
            return this.changeView( 0, 0 );
        },

        pos: function( v ) {
            var n = $C(  this.sin_fi * ( v.x - this.center.x ) + this.cos_fi * ( v.y - this.center.y ), 
                        -this.cos_fi_sin_th * ( v.x - this.center.x ) + this.sin_fi_sin_th * ( v.y - this.center.y ) - this.cos_th * ( v.z - this.center.z ),
                         this.cos_fi_cos_th * ( v.x - this.center.x ) - this.sin_fi_cos_th * ( v.y - this.center.y ) - this.sin_th * ( v.z - this.center.z ) );

            if ( this.distance > 0.0 ) {
                n.x *= this.distance / ( this.distance - n.z );
                n.y *= this.distance / ( this.distance - n.z );
            }

            n.zoom( this.zoom_all );
            n.x += this.xm + this.shift_x;
            n.y += this.ym + this.shift_y;

            return n;
        },

        sort: function() {
            if ( this.distance == 0.0 ) {
                for ( var i = 0; i < this.poly.length; i++ ) {
                    this.poly_rank[i][0] = i;
                    this.poly_rank[i][1] = this.cos_fi_cos_th * this.poly[i].center.x * this.order_weight.x - this.sin_fi_cos_th * this.poly[i].center.y * this.order_weight.y - this.sin_th * this.poly[i].center.z * this.order_weight.z;
                }
            } else {
                var x, y, z;

                for ( var i = 0; i < this.poly.length; i++ ) {
                    this.poly_rank[i][0] = i;

                    x = this.poly[i].center.x * this.order_weight.x - this.viewer.x;
                    y = this.poly[i].center.y * this.order_weight.y - this.viewer.y;
                    z = this.poly[i].center.z * this.order_weight.z - this.viewer.z;
      
                    this.poly_rank[i][1] = -x * x - y * y - z * z;
                }
            }

            this.poly_rank.sort( function( l, r ) {
                return ( l[1] > r[1] )? 1 : -1;
            } );

            return this;
        },

        render: function() {
            this.sort();
            this.light.normalize();

            for ( var i = 0; i < this.poly.length; i++ ) {
                this.poly[this.poly_rank[i][0]].render( this.shapes[i] );
            }
    
            if ( this.box && ( $t( this.box.render ) == 'function' ) ) {
                this.box.render();
            }

            return this;
        },

        remove: function() {
            var s = this.scene;
            while ( s.hasChildNodes() ) {
                s.removeChild( s.firstChild );
            }

            $each( [this.poly, this.poly_rank, this.shapes, this.callbacks], function( v ) {
                v.length = 0;
            } );

            this.box = null;
            return this;
        },

        zoomUpdate: function() {
            $each( this.poly, function( v ) {
                v.zoomUpdate();
            } );

            return this;
        },

        getColor: function( c0, c1, n, p ) {
            var r, g, b;
            var h = '0123456789abcdef';
            var z = ( this.distance == 0.0 )?
                -this.cos_fi_cos_th * n.x + this.sin_fi_cos_th * n.y + this.sin_th * n.z :
                ( p.x - this.viewer.x ) * n.x + ( p.y - this.viewer.y ) * n.y + ( p.z - this.viewer.z ) * n.z;

            if ( this.diffuse == 1.0 ) {
                return ( z > 0 )? c0 : c1;
            }

            var v = n.x * this.light.x + n.y * this.light.y + n.z * this.light.z;

            if  ( z > 0 ) {
                v *= -1;
                p  = Util.hexParts( c0 );
            } else {
                p  = Util.hexParts( c1 );
            }

            if ( v <= 0 ) {
                r = M.floor( p.r * this.diffuse );
                g = M.floor( p.g * this.diffuse );
                b = M.floor( p.b * this.diffuse );
            } else {
                r = M.floor( p.r * ( v * ( 1 - this.diffuse ) + this.diffuse ) );
                g = M.floor( p.g * ( v * ( 1 - this.diffuse ) + this.diffuse ) );
                b = M.floor( p.b * ( v * ( 1 - this.diffuse ) + this.diffuse ) );
            }

            return '#' +
                h.charAt( M.floor( r / 16 ) ) + h.charAt( r % 16 ) +
                h.charAt( M.floor( g / 16 ) ) + h.charAt( g % 16 ) +
                h.charAt( M.floor( b / 16 ) ) + h.charAt( b % 16 );
        }
    } );

    Scene.ID_COUNT = 0;


    // Poly class

    var Poly = new Class( {
        initialize: function( par, frontcol, backcol, strokecol, strokeweight, opacity ) {
            this.parent       = par;
            this.frontcolor   = frontcol;
            this.backcolor    = backcol;
            this.strokecolor  = strokecol;
            this.strokeweight = strokeweight;
            this.opacity      = opacity;
            this.phpoint      = [];
            this.point        = [];
            this.center       = $C( 0.0, 0.0, 0.0 );
            this.normal       = $C( 1.0, 0.0, 0.0 );
            this.visibility   = 'visible';
            this.id           = '';
            this.callbacks    = [];

            this.parent.addPoly( this );
        },

        pointAdd: function( x, y, z ) {
            if ( ( arguments.length == 1 ) && $t( arguments[0] ) == 'array' ) {
                $each( arguments[0], function( v ) {
                    this.pointAdd( v[0], v[1], v[2] );
                }.$bind( this ) );
            } else {
                var zm = this.parent.zoom;

                this.phpoint.push( $C( x, y, z ) );
                this.point.push( $C( x * zm.x, y * zm.y, z * zm.z ) );
            }

            return this;
        },

        pointSet: function( i, x, y, z ) {
            if ( ( arguments.length == 1 ) && $t( arguments[0] ) == 'array' ) {
                $each( arguments[0], function( v, k ) {
                    this.pointSet( k, v[0], v[1], v[2] );
                }.$bind( this ) );
            } else {
                var zm = this.parent.zoom;

                this.phpoint[i].set( x, y, z );
                this.point[i].set( x * zm.x, y * zm.y, z * zm.z );
            }

            return this;
        },

        zoom: function( f ) {
            for ( var i = 0; i < this.point.length; i++ ) {
                this.phpoint[i].zoom( f );
                this.point[i].zoom( f );
            }

            return this.refresh();
        },

        shift: function( x, y, z ) {
            var zm = this.parent.zoom;

            for ( var i = 0; i < this.point.length; i++ ) {
                this.phpoint[i].add( x, y, z );
                this.point[i].add( x * zm.x, y * zm.y, z * zm.z );
            }

            this.center.add( x * zm.x, y * zm.y, z * zm.z );
            return this;
        },

        refresh: function() {
            var l = this.point.length;
            this.center.zoom( 0.0 );

            $each( this.point, function( v ) {
                this.center.add( v );
            }.$bind( this ) );

            this.center.zoom( 1.0 / l );

            if ( l > 2 ) {
                var x0 = this.point[0].x - this.center.x;
                var y0 = this.point[0].y - this.center.y;
                var z0 = this.point[0].z - this.center.z;
                var x1 = this.point[1].x - this.center.x;
                var y1 = this.point[1].y - this.center.y;
                var z1 = this.point[1].z - this.center.z;
    
                this.normal.set( y0 * z1 - z0 * y1, z0 * x1 - x0 * z1, x0 * y1 - y0 * x1 ).normalize();
            }

            return this;
        },

        render: function( shape ) {
            // build path
            var path = [];
            for ( var i = 0; i < this.point.length; i++ ) {
                v = this.parent.pos( this.point[i] );
                path.push( [v.x, v.y] );
            }

            for ( i in this.parent.callbacks ) {
                Evt.register( shape, i, this.callbacks[i] || $empty );
            }

            var pc     = this.parent.getColor( this.frontcolor, this.backcolor, this.normal, this.center );
            var filled = ( ( this.point.length >= 3 ) && ( this.frontcolor != '' ) );

            if ( this.id != '' ) {
                shape.attr( 'id', this.id );
            }

            shape.attr( {
                'd':            Util.pathify( path ),
                'fill':         filled? pc : 'none',
                'stroke':       this.strokecolor? this.strokecolor : pc,
                'stroke-width': $i( this.strokeweight )
            } );

            if ( Client.hasSVG ) {
                shape.attr( {
                    'visibility':   this.visibility,
                    'opacity':      this.opacity
                } );
            } else {
                shape.attr( ( this.visibility == 'visible' )? {
                    'filled':       filled,
                    'opacity':      this.opacity
                } : {
                    'd':            Util.pathify( [[0, 0]] ),
                    'stroke-width': 0,
                    'filled':       false
                } );
            }

            return this;
        },

        zoomUpdate: function() {
            var zm = this.parent.zoom;

            $each( this.point, function( v, k ) {
                v.set( this.phpoint[k].x * zm.x, this.phpoint[k].y * zm.y, this.phpoint[k].z * zm.z );
            }.$bind( this ) );

            return this.refresh();
        }
    } );

    Poly.ID_COUNT = 0;

    $Y = function( obj, fn ) {
        var p = new Poly( obj.parent, obj.frontcolor, obj.backcolor, obj.strokecolor, obj.strokeweight, obj.opacity );
        
        if ( $t( fn ) == 'function' ) {
            ( fn.$bind( this ) )( p );
            p.refresh();
        }

        return p;
    };


    // BaseObject class

    var $B = BaseObject = new Class( {
        initialize: function( par, frontcol, backcol, strokecol, strokeweight, opacity, center ) {
            this.parent       = par;
            this.frontcolor   = ( frontcol   || ( frontcol  == '' ) )? frontcol  : '#0080ff';
            this.backcolor    = ( backcol    || ( backcol   == '' ) )? backcol   : '#0000ff';
            this.strokecolor  = ( strokecol  || ( strokecol == '' ) )? strokecol : '#000000';
            this.strokeweight = strokeweight || 0;
            this.opacity      = opacity      || 100;
            this.center       = center       || $C();
            this.poly3d       = [];
            this.uservalue    = null;
            this.hasevents    = false;

            var self = this;

            // build rotate functions
            function r( fi, c, ax ) {
                var fi_cos = Rot.c( fi );
                var fi_sin = Rot.s( fi );

                $each( self.poly3d, function( v ) {
                    var ax1, ax2;

                    for ( var i = 0; i < v.point.length; i++ ) {
                        ax1 = v.point[i][ax[0]] - c * self.center[ax[0]];
                        ax2 = v.point[i][ax[1]] - c * self.center[ax[1]];
                    
                        v.point[i][ax[0]] = c * self.center[ax[0]] + fi_cos * ax1 - fi_sin * ax2;
                        v.point[i][ax[1]] = c * self.center[ax[1]] + fi_sin * ax1 + fi_cos * ax2;
                    }

                    v.refresh();
                } );

                return self;
            };

            $each( {X: ['y', 'z'], Y: ['z', 'x'], Z: ['x', 'y'] }, function( v, k ) {
                self['rotate' + k] = function( fi, c ) {
                    return r( fi, c, v );
                };
            } );
        },

        setUserValue: function( val ) {
            this.uservalue = val;
            return this;
        },

        getUserValue: function() {
            return this.uservalue;
        },

        bindEvent: function( name, fn ) {
            if ( $t( fn ) != 'function' ) {
                return;
            }

            $each( this.poly3d, function( v ) {
                v.callbacks[name] = fn;
            } );

            if ( !this.hasevents ) {
                // only faciliate reference handling upon request
                $each( this.poly3d, function( v ) {
                    var id = this.parent.id + '-' + POLY_ID_PREFIX + Poly.ID_COUNT++;

                    v.id           = id;
                    OBJECT_REF[id] = this;
                    POLY_REF[id]   = v;
                }.$bind( this ) );

                this.hasevents = true;
            }

            this.parent.callbacks[name] = fn;
            return this;
        },

        zoom: function( f ) {
            $each( this.poly3d, function( v ) {
                v.zoom( f );
            } );
            
            this.center.zoom( f );
            return this;
        },

        shift: function( x, y, z ) {
            $each( this.poly3d, function( v ) {
                v.shift( x, y, z );
            } );

            this.center.add( x, y, z );
            return this;
        },

        setFrontColor: function( col ) {
            this.poly3d.$apply( 'frontcolor', col );
            return this;
        },

        setBackColor: function( col ) {
            this.poly3d.$apply( 'backcolor', col );
            return this;
        },

        setStrokeColor: function( col ) {
            this.poly3d.$apply( 'strokecolor', col );
            return this;
        },

        setStrokeWeight: function( w ) {
            this.poly3d.$apply( 'strokeweight', w );
            return this;
        },

        setOpacity: function( o ) {
            this.poly3d.$apply( 'opacity', o );
            return this;
        },

        setVisibility: function( v ) {
            $each( this.poly3d, function( v ) {
                v.visibility = ( v && ( v != 'hidden' ) )? 'visible' : 'hidden';
            } );

            return this;
        }
    } );


    // CoordPlane class

    var CoordPlane = new Class( {
        $extends: $B,

        initialize: function( par, strokecol ) {
            this.$super( par, '', '', strokecol );

            this.poly3d.push( $Y( this, function( p ) {
                p.pointAdd( [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]] );
            } ) );

            if ( strokecol == '' ) {
                this.setVisibility( false );
            }
        },

        transform: function( vc ) {
            var p = this.poly3d[0];
            var v = $C( p.point[0].x, p.point[0].y, p.point[0].z );
            v.add( ( p.point[1].x - p.point[0].x ) * vc.x + ( p.point[2].x - p.point[0].x ) * vc.y + ( p.point[3].x - p.point[0].x ) * vc.z, 
                   ( p.point[1].y - p.point[0].y ) * vc.x + ( p.point[2].y - p.point[0].y ) * vc.y + ( p.point[3].y - p.point[0].y ) * vc.z,
                   ( p.point[1].z - p.point[0].z ) * vc.x + ( p.point[2].z - p.point[0].z ) * vc.y + ( p.point[3].z - p.point[0].z ) * vc.z );

            return v;
        }
    } );


    // predefined navigators

    var navigators = ( function() {
        var picture_zoomed = 0;
        var viewer_zoomed  = 0;

        function shiftScene( scene, x, y ) {
            scene.xm += x;
            scene.ym += y;

            return scene.render();
        };

        function zoomScene( scene, v, f ) {
            if ( ( picture_zoomed + v > 5 ) || ( picture_zoomed + v < -5 ) ) {
                return scene;
            }
  
            picture_zoomed += v;
  
            if ( v > 0 ) {
                scene.zoom_all *= f;
            } else {
                scene.zoom_all /= f;
            }

            return scene.render();
        };

        function zoomViewer( scene, v, f ) {
            if ( ( viewer_zoomed + v > 5 ) || ( viewer_zoomed + v < -5 ) ) {
                return scene;
            }
  
            viewer_zoomed += v;
  
            if ( v > 0 ) {
                scene.distance *= f;
            } else {
                scene.distance /= f;
            }

            return scene.render();
        };

        return {
            KeyboardRotator: new Class( {
                initialize: function( par, options ) {
                    this.options = $extend( {
                        rotate_y:           5,
                        rotate_x:           10,
                        shift_x:            20,
                        shift_y:            20,
                        light_x:            10,
                        light_y:            10,
                        zoom_scene_factor:  1.1,
                        zoom_viewer_factor: 0.8
                    }, options || {} );

                    this.scene = par;
                    this.div   = par.parent;

                    Evt.enableKeyboard( function( evt ) {
                        var k, ctrl = false;

                        if ( evt ) {
                            k    = evt.which || evt.charCode || evt.keyCode;
                            ctrl = ( evt.ctrlKey || evt.metaKey || evt.altKey || evt.modifiers );
                        } else if ( window.event ) {
                            k    = window.event.keyCode;
                            ctrl = ( window.event.ctrlKey || window.event.metaKey || window.event.altKey );
                        } else {
                            return true;
                        }

                        if ( window.event ) {
                            evt = window.event;
                        }

                        /*
                        // map specials
                        if ( k == '' ) {                            
                            if ( ( evt.charCode == 0 ) && evt.keyCode ) {
                                if ( evt.keyCode == 37 ) {
                                    k = 28;
                                } else if ( evt.keyCode == 39 ) {
                                    k = 29;
                                } else if ( evt.keyCode == 38 ) {
                                    k = 30;
                                } else if ( evt.keyCode == 40 ) {
                                    k = 31;
                                }
                            }
                        }
                        */

                        var ch          = ( ( ( k >= 32 ) && ( k < 127 ) )? String.fromCharCode( k ) : '' ).toLowerCase();
                        var chars_up    = ['2', 'w', 'i'], keys_up    = [30, 38];
                        var chars_left  = ['4', 'a', 'j'], keys_left  = [28, 37];
                        var chars_right = ['6', 'd', 'l'], keys_right = [29, 39];
                        var chars_down  = ['8', 's', 'k'], keys_down  = [31, 40];

                        if ( ctrl ) {
                            // CTRL: shift
                            if ( evt.ctrlKey ) {
                                if ( chars_up.$in( ch ) || keys_up.$in( k ) ) {
                                    shiftScene( this.scene, 0, -this.options.shift_y );
                                } else if ( chars_left.$in( ch ) || keys_left.$in( k ) ) {
                                    shiftScene( this.scene, -this.options.shift_x, 0 );
                                } else if ( chars_right.$in( ch ) || keys_right.$in( k ) ) {
                                    shiftScene( this.scene,  this.options.shift_x, 0 );
                                } else if ( chars_down.$in( ch ) || keys_down.$in( k ) ) {
                                    shiftScene( this.scene, 0,  this.options.shift_y );
                                }
                            }
                            // ALT: light
                            else if ( evt.altKey ) {
                                if ( chars_up.$in( ch ) || keys_up.$in( k ) ) {
                                    this.scene.changeLight( -this.options.light_y, 0 ).render();
                                } else if ( chars_left.$in( ch ) || keys_left.$in( k ) ) {
                                    this.scene.changeLight( 0,  this.options.light_x ).render();
                                } else if ( chars_right.$in( ch ) || keys_right.$in( k ) ) {
                                    this.scene.changeLight( 0, -this.options.light_x ).render();
                                } else if ( chars_down.$in( ch ) || keys_down.$in( k ) ) {
                                    this.scene.changeLight(  this.options.light_y, 0 ).render();
                                }
                            }
                            // CMD: zoom scene/viewer
                            else if ( evt.metaKey ) {
                                if ( chars_up.$in( ch ) || keys_up.$in( k ) ) {
                                    zoomScene( this.scene, 1, this.options.zoom_scene_factor );
                                } else if ( chars_left.$in( ch ) || keys_left.$in( k ) ) {
                                    zoomViewer( this.scene, -1, this.options.zoom_viewer_factor );
                                } else if ( chars_right.$in( ch ) || keys_right.$in( k ) ) {
                                    zoomViewer( this.scene, 1, this.options.zoom_viewer_factor );
                                } else if ( chars_down.$in( ch ) || keys_down.$in( k ) ) {
                                    zoomScene( this.scene, -1, this.options.zoom_scene_factor );
                                }
                            }
                        } else {
                            if ( chars_up.$in( ch ) || keys_up.$in( k ) ) {
                                this.scene.changeView(  this.options.rotate_y, 0 ).render();
                            } else if ( chars_left.$in( ch ) || keys_left.$in( k ) ) {
                                this.scene.changeView( 0,  this.options.rotate_x ).render();
                            } else if ( chars_right.$in( ch ) || keys_right.$in( k ) ) {
                                this.scene.changeView( 0, -this.options.rotate_x ).render();
                            } else if ( chars_down.$in( ch ) || keys_down.$in( k ) ) {
                                this.scene.changeView( -this.options.rotate_y, 0 ).render();
                            }
                        }
    
                        Evt.stop( evt );
                        return false;
                    }.$bind( this ) );
                }
            } ),

            /* EXPERIMENTAL */
            MouseRotator: new Class( {
                initialize: function( par, options ) {
                    this.options = $extend( {
                        rotate_y: 5,
                        rotate_x: 10
                    }, options || {} );

                    this.scene = par;
                    this.div   = par.parent;

                    Evt.register( this.div, 'mouseover', function( evt ) {
                        var p = Evt.pos( evt, this.scene );

                        this.scene.changeView(
                            ( p.y < this.scene.ym )? this.options.rotate_y : -this.options.rotate_y,
                            ( p.x < this.scene.xm )? this.options.rotate_x : -this.options.rotate_x
                        ).render();
                    }.$bind( this ) );
                }
            } )
        };
    } )();


    // predefined boundingboxes

    var boundingboxes = ( function() {
        function scaleStr( j, g ) {
            return ( M.abs( g ) >= 1 )? j : M.round( 10 * j / g ) / M.round( 10 / g );
        };

        function gridCalc( min, max, scale ) {
            var i, j, x, r, d, xr, g = new Array( 3 );

            if ( ( scale <= 1 ) || ( $n( scale ) ) ) {
                d = max - min;
                r = 1;

                while ( M.abs( d ) >= 100 ) {d /= 10; r *= 10;}
                while ( M.abs( d )  <  10 ) {d *= 10; r /= 10;}
 
                d = ( ( M.abs( d ) >= 50 )? 10 * r : ( ( M.abs( d ) >= 20 )? 5 * r : 2 * r ) );
            } else {
                d = Date.$interval( max - min );
            }

            x    = M.floor( min / d ) * d;
            i    = 0;
            g[1] = d;

            for ( j = 12; j >= -1; j-- ) {
                xr = x + j * d;

                if ( ( xr >= min ) && ( xr <= max ) ) {
                    if ( i == 0 ) {
                        g[2] = xr;
                    }
      
                    g[0] = xr;
                    i++;
                }
            }

            return g;
        };

        return {
            Grid: new Class( {
                initialize: function( par, options ) {
                    this.options = $extend( {
                        max_cols:     12,
                        /*
                        max_rows:     3,
                        */
                        fillcol:      '#ffffff',
                        strokecol:    '#000000',
                        strokeweight: 1,
                        fontstyle:    {
                            fontFamily: 'Arial',
                            fontSize:   '12px'
                        }
                    }, options || {} );

                    this.parent       = par;
                    this.min          = $C( 0.0, 0.0, 0.0 );
                    this.max          = $C( 0.0, 0.0, 0.0 );
                    this.scale        = $C( 1, 1, 1 );
                    this.label        = $C( 'X', 'Y', 'Z' );
                    this.delta        = $C();
                    this.plane        = [];
                    this.line         = [];
                    this.text         = [];
                    this.restricted   = true;

                    var i, j, style, ref = Client.hasSVG? this.parent.scene : this.parent.box_group;

                    for ( i = 0; i < 3; i++ ) {
                        $append( this.plane[i] = $c( 'path', null, Client.hasSVG? {
                            zIndex:   this.parent.zindex
                        } : {
                            position: 'absolute',
                            left:     0,
                            top:      0,
                            width:    this.parent.box_group.style.width,
                            height:   this.parent.box_group.style.height,
                            zIndex:   this.parent.zindex
                        } ), ref );
                    }

                    for ( i = 0; i < 6; i++ ) {
                        this.line[i] = new Array( this.options.max_cols - 1 );
                        this.text[i] = new Array( this.options.max_cols - 1 );

                        for ( j = 0; j < this.options.max_cols - 1; j++ ) {
                            $append( this.line[i][j] = $c( 'line', {
                                'stroke-width': this.options.strokeweight
                            }, Client.hasSVG? {
                                zIndex:         this.parent.zindex + 1
                            } : {
                                position:       'absolute',
                                left:           0,
                                top:            0,
                                width:          this.parent.box_group.style.width,
                                height:         this.parent.box_group.style.height,
                                zIndex:         this.parent.zindex + 1
                            } ), ref );

                            style = Client.hasSVG? {
                                width:          1,
                                height:         20,
                                textAnchor:     'middle',
                                zIndex:         this.parent.zindex + 2
                            } : {
                                position:       'absolute',
                                left:           0,
                                top:            0,
                                width:          100,
                                height:         20,
                                textAlign:      'center',
                                zIndex:         this.parent.zindex + 2
                            };

                            $append( this.text[i][j] = $c( 'text', null, $extend( style, this.options.fontstyle ) ), ref );

                            if ( Client.hasSVG ) {
                                $append( _d.createTextNode( '' ), this.text[i][j] );
                            }
                        }
                    }
                },

                setBorder: function( xmin, ymin, zmin, xmax, ymax, zmax ) {
                    var zm = this.parent.zoom;

                    this.min.set( xmin * zm.x, ymin * zm.y, zmin * zm.z );
                    this.max.set( xmax * zm.x, ymax * zm.y, zmax * zm.z );

                    return this;
                },

                render: function() {
                    $each( {
                        z: {
                            indices:    [0, 0, 1],
                            viewcond:   ( this.min.x < this.max.x ) && ( this.min.y < this.max.y ),
                            cond:       ( this.parent.th  <   0 ),
                            cond2:      ( this.parent.fi >= 180 ),
                            cond3:      ( this.parent.fi  <  90 ) || ( this.parent.fi >= 270 ),
                            buildorder: ['x', 'y', 'x']
                        },
                        y: {
                            indices:    [1, 2, 3],
                            viewcond:   ( this.min.x < this.max.x ) && ( this.min.z < this.max.z ),
                            cond:       ( this.parent.fi >= 180 ),
                            cond2:      ( this.parent.th  <   0 ),
                            cond3:      ( this.parent.fi  <  90 ) || ( this.parent.fi >= 270 ),
                            buildorder: ['x', 'z', 'x']
                        },
                        x: {
                            indices:    [2, 4, 5],
                            viewcond:   ( this.min.y < this.max.y ) && ( this.min.z < this.max.z ),
                            cond:       ( this.parent.fi  <  90 ) || ( this.parent.fi >= 270 ),
                            cond2:      ( this.parent.th  <   0 ),
                            cond3:      ( this.parent.fi >= 180 ),
                            buildorder: ['y', 'z', 'y']
                        }
                    }, function( config, plane ) {
                        if ( config.viewcond ) {
                            var xx, yy, vc, g, p, v, u  = Client.hasSVG? 0 : 1;

                            p = $C( this.min.x, this.min.y, this.min.z );
                            p[plane] = config.cond? this.min[plane] : this.max[plane];

                            vc = this.parent.pos( p );
                            path = [[vc.x, vc.y]];

                            $each( [this.max[config.buildorder[0]], this.max[config.buildorder[1]], this.min[config.buildorder[2]]], function( v, k ) {
                                p[config.buildorder[k]] = v;
                                vc = this.parent.pos( p );
                                path.push( [vc.x, vc.y] );  
                            }.$bind( this ) );

                            p = $C();
                            p[plane] = 1;

                            this.plane[config.indices[0]].attr( {
                                'fill':         this.parent.getColor( this.options.fillcolor, this.options.fillcolor, p, config.cond? this.min : this.max ),
                                'stroke':       this.options.strokecolor,
                                'stroke-width': $i( this.options.strokeweight ),
                                'visibility':   'visible',
                                'd':            Util.pathify( path )
                            } );

                            p[plane] = config.cond? this.min[plane] : this.max[plane];

                            for ( var k = 0, itconfig = [ {
                                dir:   {z: 'x', y: 'x', x: 'y'}[plane],
                                dir2:  {z: 'y', y: 'z', x: 'z'}[plane],
                                dir3:  {z: 'x', y: 'x', x: 'y'}[plane],
                                dir4:  {z: 'z', y: 'y', x: 'y'}[plane],
                                dir5:  {z: 'x', y: 'x', x: 'y'}[plane],
                                cond:  config.cond2,
                                cond2: config.cond3
                            }, {
                                dir:   {z: 'y', y: 'z', x: 'z'}[plane],
                                dir2:  {z: 'x', y: 'x', x: 'y'}[plane],
                                dir3:  {z: 'y', y: 'z', x: 'z'}[plane],
                                dir4:  {z: 'z', y: 'y', x: 'x'}[plane],
                                dir5:  {z: 'y', y: 'z', x: 'z'}[plane],
                                cond:  config.cond3,
                                cond2: config.cond2
                            } ]; k < itconfig.length; k++ ) {
                                v = itconfig[k].dir;
                                g = gridCalc( this.min[v] / this.parent.zoom[v], this.max[v] / this.parent.zoom[v], this.scale[v] );

                                if ( this.delta[v] != 0 ) {
                                    g[1] = this.delta[v];
                                }

                                var i = 0;
                                for ( var j = g[2]; j >= g[0]; j -= g[1] ) {
                                    $each( ['x', 'y', 'z'].$without( plane ), function( v, key ) {
                                        p[v] = ( key? ( k? j * this.parent.zoom[v] : this.min[v] ) : ( k? this.min[v] : j * this.parent.zoom[v] ) );
                                    }.$bind( this ) );

                                    vc = this.parent.pos( p );
                                    this.line[config.indices[k + 1]][i].attr( 'from', $i( vc.x ) + ',' + $i( vc.y ) );

                                    xx   = vc.x;
                                    yy   = vc.y;
                                    v    = itconfig[k].dir2;
                                    p[v] = this.max[v];
                                    vc   = this.parent.pos( p );

                                    this.line[config.indices[k + 1]][i].attr( {
                                        to:         $i( vc.x ) + ',' + $i( vc.y ),
                                        stroke:     this.options.strokecolor,
                                        visibility: 'visible'
                                    } );

                                    this.text[config.indices[k + 1]][i].attr( $extend( { color: this.options.strokecolor, visibility: 'visible' }, ( itconfig[k].cond? {
                                        x: M.floor( xx + ( vc.x - xx )   * 1.06 ) - 50 * u,
                                        y: M.floor( yy + ( vc.y - yy )   * 1.06 ) -  7 * u
                                    } : {
                                        x: M.floor( vc.x + ( xx - vc.x ) * 1.06 ) - 50 * u,
                                        y: M.floor( vc.y + ( yy - vc.y ) * 1.06 ) -  7 * u
                                    } ) ) );

                                    v = itconfig[k].dir3;

                                    if ( ( i == 1 ) && ( this.label[v] ) ) {
                                        this.text[config.indices[k + 1]][i].attr( 'innerText', this.label[v] );
                                    } else {
                                        if ( $n( this.scale[v] ) ) {
                                            this.text[config.indices[k + 1]][i].attr( 'innerText', ( $t( this.scale[v] ) == 'function' )? this.scale[v]( scaleStr( j, g[1] ) ) : scaleStr( j, g[1] ) + this.scale[v] );
                                        } else {
                                            this.text[config.indices[k + 1]][i].attr( 'innerText', ( this.scale[v] == 1 )? scaleStr( j, g[1] ) : ( ( this.scale[v] > 1 )? Date.$format( j, g[1], this.scale[v] ) : '' ) );
                                        }
                                    }

                                    i++;
                                }

                                v = itconfig[k].dir4;

                                if ( this.min[v] < this.max[v] ) {
                                    v = itconfig[k].dir5;
        
                                    if ( itconfig[k].cond2 ) {
                                        if ( this.min[v] / this.parent.zoom[v] > g[0] - g[1] / 3 ) {
                                            this.text[config.indices[k + 1]][i - 1].attr( 'innerText', '' );
                                        }
                                    } else {
                                        if ( this.max[v] / this.parent.zoom[v] < g[2] + g[1] / 3 ) {
                                            this.text[config.indices[k + 1]][i].attr( 'innerText', '' );
                                        }
                                    }
                                }

                                while ( i < this.options.max_cols - 1 ) {
                                    this.line[config.indices[k + 1]][i].attr( 'visibility', 'hidden' );
                                    this.text[config.indices[k + 1]][i].attr( 'visibility', 'hidden' );  
              
                                    i++;
                                }
                            }
                        } else {
                            this.plane[config.indices[0]].attr( 'visibility', 'hidden' );

                            for ( i = 0; i < this.options.max_cols - 1; i++ ) {
                                this.line[config.indices[1]][i].attr( 'visibility', 'hidden' );
                                this.line[config.indices[2]][i].attr( 'visibility', 'hidden' );
                            }
                        }
                    }.$bind( this ) );

                    return this;
                }
            } )
        };
    } )();


    // predefined objects

    var objects = ( function() {
        function setBoxPlane( p, key, x0, y0, z0, x1, y1, z1 ) {
            switch ( key ) {
                case 0: p.pointSet( [[0, x0, y0, z0], [1, x1, y0, z0], [2, x1, y1, z0], [3, x0, y1, z0]] ); break;
                case 1: p.pointSet( [[0, x0, y1, z1], [1, x1, y1, z1], [2, x1, y0, z1], [3, x0, y0, z1]] ); break;
                case 2: p.pointSet( [[0, x0, y0, z1], [1, x1, y0, z1], [2, x1, y0, z0], [3, x0, y0, z0]] ); break;
                case 3: p.pointSet( [[0, x0, y1, z0], [1, x1, y1, z0], [2, x1, y1, z1], [3, x0, y1, z1]] ); break;
                case 4: p.pointSet( [[0, x0, y1, z0], [1, x0, y1, z1], [2, x0, y0, z1], [3, x0, y0, z0]] ); break;
                case 5: p.pointSet( [[0, x1, y0, z0], [1, x1, y0, z1], [2, x1, y1, z1], [3, x1, y1, z0]] ); break;
            }

            p.refresh();
        };

        function torusPoint( phi, theta, r, r2 ) {
            var dr = r2 * M.sin( phi );

            return {
                x: ( r + dr ) * M.sin( theta ),
                y: ( r + dr ) * M.cos( theta ),
                z: r2 * M.cos( phi )
            };
        };

        function binomCoefficient( n, k ) {
            if ( k  > n ) return 0;
            if ( k == 0 ) return 1;

            var res;

            if ( 2 * k > n ) {
                res = binomCoefficient( n, n - k );
            } else {
                res = n;

                for ( var i = 2; i <= k; ++i ) {
                    res *= n + 1 - i;
                    res /= i;
                }
            }

            return res;
        };

        function bernstein( i, n, t ) {
            return binomCoefficient( n, i ) * M.pow( t, i ) * M.pow( 1 - t, n - i );
        };

        function createPie( obj, detail, outside, start, end ) {
            detail  = detail  || 5;
            outside = outside || 5;
            start   = Util.degToRad( start );
            end     = Util.degToRad( end   );

            var step    = ( end - start ) / detail;
            var top_cnt = [0, 0,  .5];
            var btm_ctn = [0, 0, -.5];
            var x       = M.cos( start ) * outside;
            var y       = M.sin( start ) * outside;
            var top     = [x, y,  .5];
            var btm     = [x, y, -.5];
        
            obj.poly3d.push( $Y( obj, function( p ) {p.pointAdd( [top, top_cnt, btm_ctn, btm] );} ) );

            for ( var i = 1; i <= detail; i++ ) {
                x       = M.cos( start + i * step ) * outside;
                y       = M.sin( start + i * step ) * outside;
                top_new = [x, y,  .5];
                btm_new = [x, y, -.5];

                obj.poly3d.push( $Y( obj, function( p ) {p.pointAdd( [top_cnt, top, top_new] );} ) );
                obj.poly3d.push( $Y( obj, function( p ) {p.pointAdd( [btm_ctn, btm, btm_new] );} ) );
                obj.poly3d.push( $Y( obj, function( p ) {p.pointAdd( [top, top_new, btm_new, btm] );} ) );

                top = top_new;
                btm = btm_new;
            }
        
            obj.poly3d.push( $Y( obj, function( p ) {p.pointAdd( [top, top_cnt, btm_ctn, btm] );} ) );
        };

        return {
            Bezier: new Class( {
                $extends: $B,

                initialize: function( par, strokecol, strokeweight, points, detail ) {
                    this.$super( par, '', '', strokecol, strokeweight );

                    if ( $t( points ) != 'array' ) {
                        return;
                    }

                    detail = detail || 10;

                    var tmp = [];
                    var n   = points.length - 1;
                    var m   = points[0].length - 1;
                    var u, i, j, f, point;
        
                    for ( u = 0; u <= detail; ++u ) {
                        for ( v = 0; v <= detail; ++v ) {
                            point = $C();

                            for ( i = 0; i <= n; ++i ) {
                                for ( j = 0; j <= m; ++j ) {
                                    f = bernstein( i, n, u / detail ) * bernstein( j, m, v / detail );
                                    point.add( points[i][j][0] * f, points[i][j][1] * f, points[i][j][2] * f );
                                }
                            }

                            tmp.push( [point.x, point.y, point.z] );
                        }
                    }

                    this.poly3d.push( $Y( this, function( p ) {
                        p.pointAdd( tmp );
                    } ) );
                }
            } ),

            Box: new Class( {
                $extends: $B,

                initialize: function( par, frontcol, backcol, strokecol, strokeweight, opacity, x0, y0, z0, x1, y1, z1 ) {
                    this.$super( par, frontcol, backcol, strokecol, strokeweight, opacity, $C( ( x0 + x1 ) / 2, ( y0 + y1 ) / 2, ( z0 + z1 ) / 2 ) );

                    this.poly3d = [
                        $Y( this, function( p ) {p.pointAdd( [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]] );} ),
                        $Y( this, function( p ) {p.pointAdd( [[x0, y0, z1], [x0, y1, z1], [x1, y1, z1], [x1, y0, z1]] );} ),
                        $Y( this, function( p ) {p.pointAdd( [[x0, y0, z1], [x1, y0, z1], [x1, y0, z0], [x0, y0, z0]] );} ),
                        $Y( this, function( p ) {p.pointAdd( [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]] );} ),
                        $Y( this, function( p ) {p.pointAdd( [[x0, y1, z0], [x0, y1, z1], [x0, y0, z1], [x0, y0, z0]] );} ),
                        $Y( this, function( p ) {p.pointAdd( [[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]] );} )
                    ];
                },

                setPos: function( x0, y0, z0, x1, y1, z1 ) {
                    $each( this.poly3d, function( v, k ) {
                        setBoxPlane( v, k, x0, y0, z0, x1, y1, z1 );
                    } );

                    return this;
                }
            } ),

            ColorBox: new Class( {
                $extends: $B,

                initialize: function( par, strokecol, strokeweight, opacity, x0, y0, z0, x1, y1, z1, x0col, y0col, z0col, x1col, y1col, z1col ) {
                    this.$super( par, '', '', strokecol, strokeweight, opacity, $C( ( x0 + x1 ) / 2, ( y0 + y1 ) / 2, ( z0 + z1 ) / 2 ) );

                    this.x0col = x0col;
                    this.x1col = x1col;
                    this.y0col = y0col;
                    this.y1col = y1col;
                    this.z0col = z0col;
                    this.z1col = z1col;
                
                    var i = 0;
                    $each( [this.z0col, this.z1col, this.y0col, this.y1col, this.x0col, this.x1col], function( val, key ) {
                        if ( val != '#000000' ) {
                            this.poly3d[i] = $Y( $extend( this, {
                                frontcolor: val,
                                backcolor:  '#000000'
                            } ), function( p ) {
                                switch ( key ) {
                                    case 0: p.pointAdd( [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]] ); break;
                                    case 1: p.pointAdd( [[x0, y1, z1], [x1, y1, z1], [x1, y0, z1], [x0, y0, z1]] ); break;
                                    case 2: p.pointAdd( [[x0, y0, z1], [x1, y0, z1], [x1, y0, z0], [x0, y0, z0]] ); break;
                                    case 3: p.pointAdd( [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]] ); break;
                                    case 4: p.pointAdd( [[x0, y1, z0], [x0, y1, z1], [x0, y0, z1], [x0, y0, z0]] ); break;
                                    case 5: p.pointAdd( [[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]] ); break;
                                }

                                p.refresh();
                            } );

                            i++;
                        }
                    }.$bind( this ) );
                },

                setPos: function( x0, y0, z0, x1, y1, z1 ) {
                    var i = 0;
                    $each( [this.z0col, this.z1col, this.y0col, this.y1col, this.x0col, this.x1col], function( v, k ) {
                        if ( v != '#000000' ) {
                            setBoxPlane( this.poly3d[i], k, x0, y0, z0, x1, y1, z1 );
                            i++;
                        }
                    }.$bind( this ) );

                    return this;
                }
            } ),

            Cone: new Class( {
                $extends: $B,

                initialize: function( par, frontcol, backcol, strokecol, strokeweight, opacity, detail ) {
                    this.$super( par, frontcol, backcol, strokecol, strokeweight, opacity );

                    detail = detail || 7;

                    var top    = [0, 1, 0];
                    var bottom = [0, 0, 0];
                    var last   = [1, 0, 0];
                    var points = [last];
                    var actual;

                    for ( var i = 0; i < detail; i++ ) {
                        actual = [M.cos( Util.degToRad( 360 * i / detail ) ), 0, M.sin( Util.degToRad( 360 * i / detail ) )];
                        points.push( actual );
            
                        this.poly3d.push( $Y( this, function( p ) {p.pointAdd( [top,    last, actual] );} ) );
                        this.poly3d.push( $Y( this, function( p ) {p.pointAdd( [bottom, last, actual] );} ) );

                        last = actual;
                    }

                    this.poly3d.push( $Y( this, function( p ) {p.pointAdd( [top,    last, points[0]] );} ) );
                    this.poly3d.push( $Y( this, function( p ) {p.pointAdd( [bottom, last, points[0]] );} ) );
                }
            } ),

            Cube: new Class( {
                $extends: $B,

                initialize: function( par, frontcol, backcol, strokecol, strokeweight, opacity, a ) {
                    this.$super( par, frontcol, backcol, strokecol, strokeweight, opacity );
            
                    a = a || 50;

                    this.poly3d = [
                        $Y( this, function( p ) {p.pointAdd( [[-a, -a,  a], [ a, -a,  a], [ a, -a, -a], [-a, -a, -a]] );} ),
                        $Y( this, function( p ) {p.pointAdd( [[-a,  a, -a], [-a,  a,  a], [-a, -a,  a], [-a, -a, -a]] );} ),
                        $Y( this, function( p ) {p.pointAdd( [[-a,  a,  a], [ a,  a,  a], [ a, -a,  a], [-a, -a,  a]] );} ),
                        $Y( this, function( p ) {p.pointAdd( [[ a,  a, -a], [ a,  a,  a], [-a,  a,  a], [-a,  a, -a]] );} ),
                        $Y( this, function( p ) {p.pointAdd( [[ a, -a,  a], [ a,  a,  a], [ a,  a, -a], [ a, -a, -a]] );} ),
                        $Y( this, function( p ) {p.pointAdd( [[ a, -a, -a], [ a,  a, -a], [-a,  a, -a], [-a, -a, -a]] );} )
                    ];
                }
            } ),

            Cylinder: new Class( {
                $extends: $B,

                initialize: function( par, frontcol, backcol, strokecol, strokeweight, opacity, detail, outside ) {
                    this.$super( par, frontcol, backcol, strokecol, strokeweight, opacity );

                    detail  = detail  || 15;
                    outside = outside || 1;

                    createPie( this, detail, outside, 0, 360 );
                }
            } ),

            Dodecahedron: new Class( {
                $extends: $B,

                initialize: function( par, frontcol, backcol, strokecol, strokeweight, opacity, a, b, c ) {
                    this.$super( par, frontcol, backcol, strokecol, strokeweight, opacity );

                    a = a || 1.0 / ( 1.0 + SQRT_5 );
                    b = b || ( 1.0 + SQRT_5 ) / 4.0;
                    c = c || 0.5;

                    this.poly3d = [
                        $Y( this, function( p, o ) {p.pointAdd( [[-c, -c,  c], [-b,  0,  a], [-c,  c,  c], [ 0,  a,  b], [ 0, -a,  b]] );} ),
                        $Y( this, function( p, o ) {p.pointAdd( [[ 0, -a,  b], [ 0,  a,  b], [ c,  c,  c], [ b,  0,  a], [ c, -c,  c]] );} ),
                        $Y( this, function( p, o ) {p.pointAdd( [[ c, -c, -c], [ b,  0, -a], [ c,  c, -c], [ 0,  a, -b], [ 0, -a, -b]] );} ),
                        $Y( this, function( p, o ) {p.pointAdd( [[-c,  c, -c], [-b,  0, -a], [-c, -c, -c], [ 0, -a, -b], [ 0,  a, -b]] );} ),
                        $Y( this, function( p, o ) {p.pointAdd( [[ c, -c, -c], [ a, -b,  0], [ c, -c,  c], [ b,  0,  a], [ b,  0, -a]] );} ),
                        $Y( this, function( p, o ) {p.pointAdd( [[ b,  0, -a], [ b,  0,  a], [ c,  c,  c], [ a,  b,  0], [ c,  c, -c]] );} ),
                        $Y( this, function( p, o ) {p.pointAdd( [[-b,  0, -a], [-b,  0,  a], [-c, -c,  c], [-a, -b,  0], [-c, -c, -c]] );} ),
                        $Y( this, function( p, o ) {p.pointAdd( [[-c,  c, -c], [-a,  b,  0], [-c,  c,  c], [-b,  0,  a], [-b,  0, -a]] );} ),
                        $Y( this, function( p, o ) {p.pointAdd( [[ c,  c,  c], [ 0,  a,  b], [-c,  c,  c], [-a,  b,  0], [ a,  b,  0]] );} ),
                        $Y( this, function( p, o ) {p.pointAdd( [[ a,  b,  0], [-a,  b,  0], [-c,  c, -c], [ 0,  a, -b], [ c,  c, -c]] );} ),
                        $Y( this, function( p, o ) {p.pointAdd( [[ a, -b,  0], [-a, -b,  0], [-c, -c,  c], [ 0, -a,  b], [ c, -c,  c]] );} ),
                        $Y( this, function( p, o ) {p.pointAdd( [[ c, -c, -c], [ 0, -a, -b], [-c, -c, -c], [-a, -b,  0], [ a, -b,  0]] );} )
                    ];
                }
            } ),

            Icosahedron: new Class( {
                $extends: $B,

                initialize: function( par, frontcol, backcol, strokecol, strokeweight, opacity, a, b ) {
                    this.$super( par, frontcol, backcol, strokecol, strokeweight, opacity );

                    a = a || 0.5;
                    b = b || 1.0 / ( 1.0 + SQRT_5 );

                    this.poly3d = [
                        $Y( this, function( p ) {p.pointAdd( [[ 0,  b, -a], [ b,  a,  0], [-b,  a,  0]] );} ),
                        $Y( this, function( p ) {p.pointAdd( [[ 0,  b,  a], [-b,  a,  0], [ b,  a,  0]] );} ),
                        $Y( this, function( p ) {p.pointAdd( [[ 0,  b,  a], [ 0, -b,  a], [-a,  0,  b]] );} ),
                        $Y( this, function( p ) {p.pointAdd( [[ 0,  b,  a], [ a,  0,  b], [ 0, -b,  a]] );} ),
                        $Y( this, function( p ) {p.pointAdd( [[ 0,  b, -a], [ 0, -b, -a], [ a,  0, -b]] );} ),
                        $Y( this, function( p ) {p.pointAdd( [[ 0,  b, -a], [-a,  0, -b], [ 0, -b, -a]] );} ),
                        $Y( this, function( p ) {p.pointAdd( [[ 0, -b,  a], [ b, -a,  0], [-b, -a,  0]] );} ),
                        $Y( this, function( p ) {p.pointAdd( [[ 0, -b, -a], [-b, -a,  0], [ b, -a,  0]] );} ),
                        $Y( this, function( p ) {p.pointAdd( [[-b,  a,  0], [-a,  0,  b], [-a,  0, -b]] );} ),
                        $Y( this, function( p ) {p.pointAdd( [[-b, -a,  0], [-a,  0, -b], [-a,  0,  b]] );} ),
                        $Y( this, function( p ) {p.pointAdd( [[ b,  a,  0], [ a,  0, -b], [ a,  0,  b]] );} ),
                        $Y( this, function( p ) {p.pointAdd( [[ b, -a,  0], [ a,  0,  b], [ a,  0, -b]] );} ),
                        $Y( this, function( p ) {p.pointAdd( [[ 0,  b,  a], [-a,  0,  b], [-b,  a,  0]] );} ),
                        $Y( this, function( p ) {p.pointAdd( [[ 0,  b,  a], [ b,  a,  0], [ a,  0,  b]] );} ),
                        $Y( this, function( p ) {p.pointAdd( [[ 0,  b, -a], [-b,  a,  0], [-a,  0, -b]] );} ),
                        $Y( this, function( p ) {p.pointAdd( [[ 0,  b, -a], [ a,  0, -b], [ b,  a,  0]] );} ),
                        $Y( this, function( p ) {p.pointAdd( [[ 0, -b, -a], [-a,  0, -b], [-b, -a,  0]] );} ),
                        $Y( this, function( p ) {p.pointAdd( [[ 0, -b, -a], [ b, -a,  0], [ a,  0, -b]] );} ),
                        $Y( this, function( p ) {p.pointAdd( [[ 0, -b,  a], [-b, -a,  0], [-a,  0,  b]] );} ),
                        $Y( this, function( p ) {p.pointAdd( [[ 0, -b,  a], [ a,  0,  b], [ b, -a,  0]] );} )
                    ];
                }
            } ),

            Line: new Class( {
                $extends: $B,

                initialize: function( par, strokecol, strokeweight, x0, y0, z0, x1, y1, z1 ) {
                    this.$super( par, '', '', strokecol, strokeweight, $C( ( x0 + x1 ) / 2, ( y0 + y1 ) / 2, ( z0 + z1 ) / 2 ) );

                    this.poly3d.push( $Y( this, function( p ) {
                        p.pointAdd( [[x0, y0, z0], [x1, y1, z1]] );
                    } ) );
                }
            } ),

            Octahedron: new Class( {
                $extends: $B,

                initialize: function( par, frontcol, backcol, strokecol, strokeweight, opacity, a, b ) {
                    this.$super( par, frontcol, backcol, strokecol, strokeweight, opacity );

                    a = a || SQRT_EIGHTH;
                    b = b || 0.5;

                    this.poly3d = [
                        $Y( this, function( p ) {p.pointAdd( [[-a, 0,  a], [-a, 0, -a], [0,  b, 0]] );} ),
                        $Y( this, function( p ) {p.pointAdd( [[-a, 0, -a], [ a, 0, -a], [0,  b, 0]] );} ),
                        $Y( this, function( p ) {p.pointAdd( [[ a, 0, -a], [ a, 0,  a], [0,  b, 0]] );} ),
                        $Y( this, function( p ) {p.pointAdd( [[ a, 0,  a], [-a, 0,  a], [0,  b, 0]] );} ),
                        $Y( this, function( p ) {p.pointAdd( [[ a, 0, -a], [-a, 0, -a], [0, -b, 0]] );} ),
                        $Y( this, function( p ) {p.pointAdd( [[-a, 0, -a], [-a, 0,  a], [0, -b, 0]] );} ),
                        $Y( this, function( p ) {p.pointAdd( [[ a, 0,  a], [ a, 0, -a], [0, -b, 0]] );} ),
                        $Y( this, function( p ) {p.pointAdd( [[-a, 0,  a], [ a, 0,  a], [0, -b, 0]] );} )
                    ];
                }
            } ),

            Pie: new Class( {
                $extends: $B,

                initialize: function( par, frontcol, backcol, strokecol, strokeweight, opacity, detail, outside, start, end ) {
                    this.$super( par, frontcol, backcol, strokecol, strokeweight, opacity );

                    detail  = detail  || 5;
                    outside = outside || 5;
                    start   = start   || 0;
                    end     = end     || 45;

                    createPie( this, detail, outside, start, end );
                }
            } ),

            Pyramid: new Class( {
                $extends: $B,

                initialize: function( par, frontcol, backcol, strokecol, strokeweight, opacity, a, b ) {
                    this.$super( par, frontcol, backcol, strokecol, strokeweight, opacity );

                    a = a || SQRT_EIGHTH;
                    b = b || .5;

                    this.poly3d = [
                        $Y( this, function( p ) {p.pointAdd( [[-a,  a, 0], [-a, -a, 0], [ 0, 0, b]] );} ),
                        $Y( this, function( p ) {p.pointAdd( [[-a, -a, 0], [ a, -a, 0], [ 0, 0, b]] );} ),
                        $Y( this, function( p ) {p.pointAdd( [[ a,  a, 0], [-a,  a, 0], [ 0, 0, b]] );} ),
                        $Y( this, function( p ) {p.pointAdd( [[ a, -a, 0], [ a,  a, 0], [ 0, 0, b]] );} ),
                        $Y( this, function( p ) {p.pointAdd( [[ a, -a, 0], [ a,  a, 0], [-a, a, 0], [-a, -a, 0]] );} )
                    ];
                }
            } ),

            Sphere: new Class( {
                $extends: $B,

                initialize: function( par, frontcol, backcol, strokecol, strokeweight, opacity, r, detail ) {
                    this.$super( par, frontcol, backcol, strokecol, strokeweight, opacity );

                    r      = r      || 1.0;
                    detail = detail || 4;

                    var self    = this;
                    var ln      = r / SQRT_3;
                    var points  = [[SQRT_2 * -ln, ln, 0], [SQRT_2 *  ln, ln, 0], [0, -ln, SQRT_2 * -ln], [0, -ln, SQRT_2 *  ln]];
                    var virtual = [[0, 1, 3], [1, 2, 3], [0, 2, 1], [0, 3, 2]];
                    var mul, new_x, new_y, new_z, n, lines, new_poly, proceeded;

                    for ( var i = 0; i < detail; i++ ) {
                        new_poly  = [];
                        proceeded = [];

                        $each( virtual, function( pt ) {
                            n     = [];
                            lines = [[M.min( pt[0], pt[1] ), M.max( pt[0], pt[1] )], [M.min( pt[1], pt[2] ), M.max( pt[1], pt[2] )], [M.min( pt[2], pt[0] ), M.max( pt[2], pt[0] )]];

                            $each( lines, function( line ) {
                                if ( $t( proceeded[line[0]] ) == 'undefined' ) {
                                    proceeded[line[0]] = [];
                                }

                                if ( $t( proceeded[line[0]][line[1]] ) == 'undefined' ) {
                                    new_x = ( points[line[0]][0] + points[line[1]][0] ) / 2;
                                    new_y = ( points[line[0]][1] + points[line[1]][1] ) / 2;
                                    new_z = ( points[line[0]][2] + points[line[1]][2] ) / 2;
                                    mul   = r / M.sqrt( M.pow( new_x, 2 ) + M.pow( new_y, 2 ) + M.pow( new_z, 2 ) );

                                    points.push( [new_x * mul, new_y * mul, new_z * mul] );
                                    proceeded[line[0]][line[1]] = points.length - 1;
                                }
                
                                n.push( proceeded[line[0]][line[1]] );
                            } );

                            new_poly.push( [pt[0], n[0], n[2]] );
                            new_poly.push( [pt[1], n[1], n[0]] );
                            new_poly.push( [pt[2], n[2], n[1]] );
                            new_poly.push( [ n[0], n[1], n[2]] );
                        } );

                        virtual = new_poly;
                    }

                    $each( virtual, function( pt ) {
                        $Y( self, function( p ) {p.pointAdd( [points[pt[0]], points[pt[1]], points[pt[2]]] );} );
                    } );
                }
            } ),

            Spline: new Class( {
                $extends: $B,

                initialize: function( par, frontcol, backcol, strokecol, strokeweight, bsi, size ) {
                    this.$super( par, frontcol, backcol, strokecol, strokeweight );

                    bsi  = bsi  || 4;
                    size = size || 50;

                    for ( x = -size, p1 = 0; x <= ( size - bsi ); x += bsi, p1++ ) {
                        this.poly3d[p1] = $Y( this, function( p ) {
                            p.pointAdd( [[x, x, x], [x + bsi, x + bsi, x + bsi]] );
                        } );
                    }
                }
            } ),

            Tetrahedron: new Class( {
                $extends: $B,

                initialize: function( par, frontcol, backcol, strokecol, strokeweight, opacity, a ) {
                    this.$super( par, frontcol, backcol, strokecol, strokeweight, opacity );

                    a = a || 50;

                    this.poly3d = [
                        $Y( this, function( p ) {p.pointAdd( [[ a,  a,  a], [-a,  a, -a], [ a, -a, -a]] );} ),
                        $Y( this, function( p ) {p.pointAdd( [[-a,  a, -a], [-a, -a,  a], [ a, -a, -a]] );} ),
                        $Y( this, function( p ) {p.pointAdd( [[ a,  a,  a], [ a, -a, -a], [-a, -a,  a]] );} ),
                        $Y( this, function( p ) {p.pointAdd( [[ a,  a,  a], [-a, -a,  a], [-a,  a, -a]] );} )
                    ];
                }
            } ),

            TorusX: new Class( {
                $extends: $B,

                initialize: function( par, frontcol, backcol, strokecol, strokeweight, opacity, r, n, r2, n2 ) {
                    this.$super( par, frontcol, backcol, strokecol, strokeweight, opacity );

                    var d = -1;

                    for ( var s = 0; s < n2 * n - d; s++ ) {
                        this.poly3d[s] = $Y( this, function( p ) {
                            var tp;

                            for ( var i = 0, q = [s, s + 1, s + n2 + 1, s + n2]; i < q.length; i++ ) {
                                tp = torusPoint( 2  * M.PI * q[i] * n / ( n2 * n - d ), 2  * M.PI * q[i] / ( n2 * n - d ), r, r2 );
                                p.pointAdd( tp.z, tp.x, tp.y );
                            }
                        } );
                    }
               }
            } ),

            TorusZ: new Class( {
                $extends: $B,

                initialize: function( par, frontcol, backcol, strokecol, strokeweight, opacity, r, n, r2, n2 ) {
                    this.$super( par, frontcol, backcol, strokecol, strokeweight, opacity );

                    var d = -1;
                    var m = ( 2 * n2 - 1 ) * ( 2 * n - 1 ) - d;

                    for ( var s = 0; s < m / 2; s++ ) {
                        this.poly3d[s] = $Y( this, function( p ) {
                            var tp;

                            for ( var i = 0, q = [2 * s + 1, 2 * s + ( 2 * n2 - 1 ) + 2, 2 * s + 2 * ( 2 * n2 - 1 ) + 1, 2 * s + ( 2 * n2 - 1 )]; i < q.length; i++ ) {
                                tp = torusPoint( ( 2 * n - 1 ) * 2 * M.PI * q[i] / m, 2 * M.PI * q[i] / m, r, r2 );
                                p.pointAdd( tp.x, tp.y, tp.z );
                            }
                        } );
                    }
                }
            } )
        };
    } )();


    // expose bare minimum
    window.Filippo = {
        Class:         Class,
        Client:        Client,
        Util:          Util,
        Evt:           Evt,
        Transition:    Transition,
        Animation:     Animation,
        Vertex:        Vertex,
        Edge:          Edge,
        Triangle:      Triangle,
        Vector:        Vector,
        Coordinate:    Coordinate,
        Matrix:        Matrix,
        Line:          Line,
        Plane:         Plane,
        Scene:         Scene,
        Poly:          Poly,
        BaseObject:    BaseObject,
        CoordPlane:    CoordPlane,

        navigators:    navigators,
        boundingboxes: boundingboxes,
        objects:       objects,
        extensions:    {},

        // shortcuts
        $X: $X,
        $E: $E,
        $T: $T,
        $V: $V,
        $C: $C,
        $M: $M,
        $L: $L,
        $P: $P,
        $Y: $Y
    };
} )();