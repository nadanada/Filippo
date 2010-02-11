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
    */
 
    /*
    TODO:

    - more extensive IE tests
    - transparency tests
    - Rubik's Cube iPhone App (half way through)
    - configurable Bounding Box, Text Styles, Labels
    - configurable Scene-Navigator (up/down/left/right; with Shift: Light)
    - cones, balls, ...
    */

    var LIBRARY    = 'Filippo';
    var VERSION    = '0.4.3';

    var NS_SVG     = 'http://www.w3.org/2000/svg';
    var NS_VML     = 'urn:schemas-microsoft-com:vml';

    var PI_DIV_180 = Math.PI / 180;


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
        var type = $type( obj );
        return type? ( ( type != 'array' )? [obj] : obj ) : [];
    };
    
    function $each( iterable, fn ) {
        var type = $type( iterable );

        if ( type == 'object' ) {
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
        var mix = {};

        for ( var i = 0, l = arguments.length; i < l; i++ ) {
            var object = arguments[i];

            if ( $type( object ) != 'object' ) {
                continue;
            }

            for ( var key in object ) {
                var op = object[key], mp = mix[key];
                mix[key] = ( mp && ( $type( op ) == 'object' ) && ( $type( mp ) == 'object' ) )? $merge( mp, op ) : $unlink( op );
            }
        }

        return mix;
    };

    function $unlink( object ) {
        var unlinked;

        switch ( $type( object ) ) {
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

    function $addEvent( elm, evType, fn, useCapture ) {
        if ( elm.addEventListener ) {
            elm.addEventListener( evType, fn, useCapture || false );
        } else if ( elm.attachEvent ) {
            elm.attachEvent( 'on' + evType, fn );
        } else {
            elm['on' + evType] = fn;
        }

        return elm;
    };

    function $console( str, level ) {
        var level = level || 'log';

        try {
            if ( window.console && ( level in console ) ) {
                console[level]( LIBRARY + ': ', str );
            }
        } catch ( ex ) {
        }
    };
    
    function $bound( val, min, max ) {
        if ( ( typeof min != 'undefined' ) && ( val < min ) ) {
            val = min;
        }
        
        if ( ( typeof max != 'undefined' ) && ( val > max ) ) {
            val = max;
        }
        
        return val;
    };

    function $( id ) {
        return document.getElementById( id );
    };

    Function.prototype.$bind = function( ctx ) {        var self = this;        
        return function() {            return self.apply( ctx, arguments );        };    };

    Array.prototype.$in = function( value ) {
        for ( var i = 0; i < this.length; i++ ) {
            if ( this[i] === value ) {
                return true;
            }
        }

        return false;
    };

    Array.prototype.$apply = function( key, value ) {
        for ( var i = 0; i < this.length; i++ ) {
            this[i][key] = value;
        }
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
        var mth = new Array( 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' );
        var wd  = new Array( 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' );

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

    var $type = function( ele ) {
        return $type.s.call( ele ).match( /^\[object\s(.*)\]$/ )[1].toLowerCase();
    };

    $type.s = Object.prototype.toString;


    // class mechanism

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
                $extend( self, ( $type( klass ) == 'function' )? new klass : klass );
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
                var type     = $type( override );

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
        var hasSVG  = !isIE; // blatant assumption, experiment with ( !isIE && document.implementation.hasFeature( 'http://www.w3.org/TR/SVG11/feature#Shape', '1.0' ) );
        var hasVML  = ( isIE  && ( function() {
            var a = document.body.appendChild( document.createElement( 'div' ) );
            a.innerHTML = '<v:shape id="vml_flag1" adj="1" />';
            var b = a.firstChild;
            b.style.behavior = 'url(#default#VML)';
            var supported = b? ( $type( b.adj ) == 'object' ) : true;
            a.parentNode.removeChild( a ); 
    
            return supported;
        } )() );

        if ( isIE && hasVML && ( document.namespaces['v'] == null ) ) {
            for ( var i = 0, s = document.createStyleSheet(), e = 'shape shapetype group background path formulas handles fill stroke shadow textbox textpath imagedata line polyline curve roundrect oval rect arc image'.split( ' ' ); i < e.length; i++ ) {
                s.addRule( "v\\:" + e[i], "behavior: url(#default#VML);");
            }
            
            document.namespaces.add( 'v', NS_VML/*, '#default#VML'*/ );
        }

        return {
            Opera:     isOpera,
            IE:        isIE,
            WebKit:    ( ua.indexOf( 'applewebkit/' ) > -1 ),
            Chrome:    ( ua.indexOf( 'chrome' ) > -1 ),
            Gecko:     ( ua.indexOf( 'gecko'  ) > -1 ) && ( ua.indexOf( 'khtml' ) === -1 ),
            hasSVG:    hasSVG,
            hasVML:    hasVML,
            isCapable: hasSVG || hasVML
        };
    } )();


    // library
    
    var Util = {
        rnd: function( v ) {
            return Math.floor( Math.random() * v );
        },

        eventTarget: function( evt ) {
            return evt.target? evt.target : evt.srcElement;
        },

        pathify: function( a ) {
            var first = a.shift();
            var str   = Client.hasSVG?
                'M ' + parseInt( first[0] ) + ' ' + parseInt( first[1] ) + ' ' :
                'm ' + parseInt( first[0] ) + ',' + parseInt( first[1] ) + ' l';

            for ( i = 0; i < a.length; i++ ) {
                str += Client.hasSVG?
                    'L ' + parseInt( a[i][0] ) + ' ' + parseInt( a[i][1] ) + ' ' :
                    ( ( i == 0 )? ' ' : '' ) + parseInt( a[i][0] ) + ',' + parseInt( a[i][1] ) + ( ( i < a.length - 1 )? ',' : '' );
            }

            return str + ( Client.hasSVG? 'z' : ' x e' );
        },

        hexParts: function( str ) {
            return {
                r: parseInt( str.substr( 1, 2 ), 16 ),
                g: parseInt( str.substr( 3, 2 ), 16 ),
                b: parseInt( str.substr( 5, 2 ), 16 )
            }
        }
    };


    var Vector = new Class( {
        initialize: function( x, y, z ) {
            this.set( x || 0, y || 0, z || 0 );
        },

        add: function( v ) {
            if ( arguments.length == 3 ) {
                this.x += arguments[0];
                this.y += arguments[1];
                this.z += arguments[2];
            } else {
                this.x += v.x;
                this.y += v.y;
                this.z += v.z;
            }

            return this;
        },

        set: function( x, y, z ) {
            this.x = x;
            this.y = y;
            this.z = z;

            return this;
        },

        zoom: function( f ) {
            this.x *= f;
            this.y *= f;
            this.z *= f;

            return this;
        },

        normalize: function() {
            var l = 0;
            l += this.x * this.x;
            l += this.y * this.y;
            l += this.z * this.z;

            if ( l > 0.0 ) {
                l = Math.sqrt( l );

                this.x /= l;
                this.y /= l;
                this.z /= l;
            } else {
                this.x  = 1.0;
            }

            return this;
        }
    } );


    var Scene = new Class( {
        initialize: function( id, z, w, h ) {
            if ( !Client.isCapable ) {
                return;
            }

            var id = id || Scene.idc++;

            // create fallback if canvas is not in place
            if ( !$( id ) ) {
                var div = document.createElement( 'div' );
                div.id  = id;

                with ( div.style ) {
                    position = 'relative';
                    width    = w || 500;
                    height   = h || 500;
                    overflow = 'hidden';
                }

                document.getElementsByTagName( 'body' )[0].appendChild( div );
            }

            this.parent = this.scene = $( id );
            

            var w = this.parent.style.width;
            var h = this.parent.style.height;

            if ( Client.hasSVG ) {
                var doc;
                this.parent.appendChild( doc = Scene.$c( 'svg', {
                    viewBox: '0 0 ' + parseInt( w ) + ' ' + parseInt( h ),
                    width:   w,
                    height:  h
                } ) );

                doc.appendChild( this.scene = Scene.$c( 'g' ) );
            }
            
            this.grid          = null;
            this.poly          = [];
            this.poly_rank     = [];
            this.shape         = [];
            this.zindex        = z || 1;
            this.center        = new Vector( 0.0, 0.0, 0.0 );
            this.zoom          = new Vector( 1.0, 1.0, 1.0 );
            this.order_weight  = new Vector( 1.0, 1.0, 1.0 );
            this.zoom_all      = 1.0;
            this.shift_x       = 0.0;
            this.shift_y       = 0.0;
            this.xm            = parseInt( w ) / 2;
            this.ym            = parseInt( h ) / 2;
            this.distance      = 1000.0;
            this.viewer        = new Vector( 1000.0, 0.0, 0.0 );
            this.light         = new Vector( 1.0, 0.0, 0.0 );
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

            this.create();
        },

        create: function() {
            if ( Client.hasSVG ) {
                this.box_group  = null;
                this.poly_group = null;
            } else {
                var attrs = {
                    coordorigin: '0,0',
                    coordsize:   parseInt( this.xm * 2 ) + ',' + parseInt( this.ym * 2 )
                };

                var styles = {
                    position:    'absolute',
                    top:         0,
                    left:        0,
                    width:       parseInt( this.xm * 2 ),
                    height:      parseInt( this.ym * 2 )
                };

                this.scene.insertBefore( this.box_group  = Scene.$c( 'v:group', attrs, styles ), null );
                this.scene.insertBefore( this.poly_group = Scene.$c( 'v:group', attrs, styles ), null );
            }

            return this;
        },

        changeView: function( th, fi ) {
            if ( ( this.th + th >= -89.0 ) && ( this.th + th <= 89.0 ) ) {
                this.th += th;
            }

            this.fi += fi;

            while ( this.fi < 0.0 ) {
                this.fi += 360.0;
            }

            while ( this.fi >= 360.0 ) {
                this.fi -= 360.0;
            }

            this.sin_th        = Math.sin( this.th * PI_DIV_180 );
            this.cos_th        = Math.cos( this.th * PI_DIV_180 );
            this.sin_fi        = Math.sin( this.fi * PI_DIV_180 );
            this.cos_fi        = Math.cos( this.fi * PI_DIV_180 );
            this.cos_fi_sin_th = this.cos_fi * this.sin_th;
            this.sin_fi_sin_th = this.sin_fi * this.sin_th;
            this.cos_fi_cos_th = this.cos_fi * this.cos_th;
            this.sin_fi_cos_th = this.sin_fi * this.cos_th;

            this.viewer.set( this.center.x + this.cos_fi_cos_th * this.distance, this.center.y - this.sin_fi_cos_th * this.distance, this.center.z - this.sin_th * this.distance );
            return this;
        },

        changeLight: function( th, fi ) {
            if ( ( this.light_th + th >= -89.0 ) && ( this.light_th + th <= 89.0 ) ) {
                this.light_th += th;
            }

            this.light_th  = $bound( this.light_th, -89.0,  89.0 );
            this.light_fi += fi;

            while ( this.light_fi < 0.0 ) {
                this.light_fi += 360.0;
            }

            while ( this.light_fi >= 360.0 ) {
                this.light_fi -= 360.0;
            }

            this.light.set( Math.cos( this.light_fi * PI_DIV_180 ) * Math.cos( this.light_th * PI_DIV_180 ), -Math.sin( this.light_fi * PI_DIV_180 ) * Math.cos( this.light_th * PI_DIV_180 ), -Math.sin( this.light_th * PI_DIV_180 ) );
            return this;
        },

        addPoly: function( o ) {
            var l = this.poly.length;
            var z = this.zindex + l + 3; // reserve 0-2 for grid

            this.poly[l]      = o;
            this.poly_rank[l] = new Array( l, 0 );

            if ( Client.hasSVG ) {
                this.scene.appendChild( this.shape[l] = Scene.$c( 'path', {
                    'z-index': z
                } ) );
            } else {
                this.poly_group.insertBefore( this.shape[l] = Scene.$c( 'v:shape', null, {
                    position: 'absolute',
                    left:     0,
                    top:      0,
                    width:    this.poly_group.style.width,
                    height:   this.poly_group.style.height,
                    zIndex:   z
                } ), null );
            }

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
            l     = ( v > 0.0 )? Math.sqrt( v ) : 19.0;

            this.zoom_all = ( this.xm < this.ym )? 1.6 * this.xm / l : 1.6 * this.ym / l;
            this.distance = 2 * l;
  
            return this.changeView( 0, 0 );
        },

        pos: function( v ) {
            var n = new Vector( this.sin_fi * ( v.x - this.center.x ) + this.cos_fi * ( v.y - this.center.y ), -this.cos_fi_sin_th * ( v.x - this.center.x ) + this.sin_fi_sin_th * ( v.y - this.center.y ) - this.cos_th * ( v.z - this.center.z ), this.cos_fi_cos_th * ( v.x - this.center.x ) - this.sin_fi_cos_th * ( v.y - this.center.y ) - this.sin_th * ( v.z - this.center.z ) );

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
            this.light.normalize();

            for ( var i = 0; i < this.poly.length; i++ ) {
                this.poly[this.poly_rank[i][0]].render( this.shape[i] );
            }
    
            if ( this.grid ) {
                this.grid.render();
            }

            return this;
        },

        remove: function() {
            var s = this.scene;
            while ( s.hasChildNodes() ) {
                s.removeChild( s.firstChild );
            }

            this.poly.length      =
            this.poly_rank.length =
            this.shape.length     =
            this.callbacks.length = 0;
            this.grid             = null;

            return this;
        },

        zoomUpdate: function() {
            $each( this.poly, function( v ) {
                v.zoomUpdate();
            } );

            return this;
        },

        getColor: function( c0, c1, n, p ) {
            var r, g, b, p;
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
                r = Math.floor( p.r * this.diffuse );
                g = Math.floor( p.g * this.diffuse );
                b = Math.floor( p.b * this.diffuse );
            } else {
                r = Math.floor( p.r * ( v * ( 1 - this.diffuse ) + this.diffuse ) );
                g = Math.floor( p.g * ( v * ( 1 - this.diffuse ) + this.diffuse ) );
                b = Math.floor( p.b * ( v * ( 1 - this.diffuse ) + this.diffuse ) );
            }

            return '#' +
                h.charAt( Math.floor( r / 16 ) ) + h.charAt( r % 16 ) +
                h.charAt( Math.floor( g / 16 ) ) + h.charAt( g % 16 ) +
                h.charAt( Math.floor( b / 16 ) ) + h.charAt( b % 16 );
        }
    } );

    $extend( Scene, {
        idc: 0,
        $c:  function( v, attributes, styles ) {
            var e = $extend( Client.hasSVG? document.createElementNS( NS_SVG, v ) : document.createElement( v ), {
                attr: function( key, val ) {
                    if ( $type( arguments[0] ) == 'object' ) {
                        $each( arguments[0], function( v, k ) {
                            this.attr( k, v );
                        }.$bind( this ) );

                        return this;
                    }

                    if ( Client.hasSVG ) {
                        if ( key== 'from' ) {
                            var tmp = val.split( ',' );
                            this.setAttribute( 'x1', tmp[0] );
                            this.setAttribute( 'y1', tmp[1] );
                            return this;
                        }

                        if ( key == 'to' ) {
                            var tmp = val.split( ',' );
                            this.setAttribute( 'x2', tmp[0] );
                            this.setAttribute( 'y2', tmp[1] );
                            return this;
                        }

                        if ( key == 'color') {
                            this.setAttribute( 'fill', val );
                            return this;
                        }

                        if ( key == 'innerText' ) {
                            this.firstChild.replaceData( 0, 108, val );
                            return this;
                        }

                        this.setAttribute( key, val );
                    } else {
                        var map = {
                            'fill':         this.fillcolor,
                            'stroke':       this.strokecolor,
                            'stroke-width': this.strokeweight,
                            'visibility':   this.style.visibility,
                            'from':         this.from,
                            'to':           this.to,
                            'x':            this.style.left,
                            'y':            this.style.top,
                            'd':            this.path,
                            'color':        this.style.color,
                            'innerText':    this.innerText
                        };

                        ( ( key in map )? map : this )[key] = val;
                    }

                    return this;
                }
            } );

            if ( $type( attributes ) == 'object' ) {
                $each( attributes, function( val, key ) {
                    e.attr( key, val );
                } );
            }

            if ( $type( styles ) == 'object' ) {
                $each( styles, function( val, key ) {
                    e.style[key] = val;
                } );
            }

            return e;
        }
    } );


    var Poly = new Class( {
        initialize: function( par, frontcol, backcol, strokecol, strokeweight ) {
            this.parent       = par;
            this.phpoint      = [];
            this.point        = [];
            this.center       = new Vector( 0.0, 0.0, 0.0 );
            this.normal       = new Vector( 1.0, 0.0, 0.0 );
            this.frontcolor   = frontcol;
            this.backcolor    = backcol;
            this.strokecolor  = strokecol;
            this.strokeweight = strokeweight;
            this.visibility   = 'visible';
            this.id           = '';
            this.callbacks    = [];

            this.parent.addPoly( this );
        },

        pointAdd: function( x, y, z ) {
            if ( ( arguments.length == 1 ) && $type( arguments[0] ) == 'array' ) {
                $each( arguments[0], function( v ) {
                    this.pointAdd( v[0], v[1], v[2] );
                }.$bind( this ) );
            } else {
                var zm = this.parent.zoom;

                this.phpoint.push( new Vector( x, y, z ) );
                this.point.push( new Vector( x * zm.x, y * zm.y, z * zm.z ) );
            }

            return this;
        },

        pointSet: function( i, x, y, z ) {
            if ( ( arguments.length == 1 ) && $type( arguments[0] ) == 'array' ) {
                $each( arguments[0], function( v ) {
                    this.pointSet( v[0], v[1], v[2], v[3] );
                }.$bind( this ) );
            } else {
                var zm = this.parent.zoom;

                this.phpoint[i].set( x, y, z );
                this.point[i].set( x * zm.x, y * zm.y, z * zm.z );
            }

            return this;
        },

        zoom: function( f ) {
            $each( this.phpoint, function( v ) {
                v.zoom( f );
            } );

            $each( this.point, function( v ) {
                v.zoom( f );
            } );

            return this.refresh();
        },

        shift: function( x, y, z ) {
            var zm = this.parent.zoom;

            $each( this.phpoint, function( v ) {
                v.add( x, y, z );
            } );

            $each( this.point, function( v ) {
                v.add( x * zm.x, y * zm.y, z * zm.z );
            }.$bind( this ) );

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
            var l  = this.point.length;
            var pc = this.parent.getColor( this.frontcolor, this.backcolor, this.normal, this.center );
            var v  = this.parent.pos( this.point[0] );

            shape.id = this.id;

            for ( i in this.parent.callbacks ) {
                $addEvent( shape, i, this.callbacks[i] || $empty );
            }

            // build path
            var path = [];
            for ( var i = 0; i < l; i++ ) {
                v = this.parent.pos( this.point[i] );
                path.push( [v.x, v.y] );
            }

            if ( Client.hasSVG ) {
                shape.attr( {
                    'd':            Util.pathify( path ),
                    'fill':         ( ( l >= 3 ) && ( this.frontcolor != '' ) )? pc : 'none',
                    'stroke':       this.strokecolor? this.strokecolor : pc,
                    'stroke-width': parseInt( this.strokeweight ),
                    'visibility':   this.visibility
                } );
            } else {
                if ( this.visibility == 'visible' ) {
                    var isFilled = ( ( l >= 3 ) && ( this.frontcolor != '' ) );

                    shape.attr( {
                        'd':            Util.pathify( path ),
                        'stroke-width': parseInt( this.strokeweight ),
                        'stroke':       this.strokecolor? this.strokecolor : pc,
                        'filled':       isFilled
                    } );

                    if ( isFilled ) {
                        shape.attr( 'fillcolor', pc );
                    }
                } else {
                    shape.attr( {
                        'd':            Util.pathify( [[0, 0]] ),
                        'stroke-width': 0,
                        'filled':       false
                    } );
                }
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

    Poly.$c = function( obj, fn ) {
        var p = new Poly( obj.parent, obj.frontcolor, obj.backcolor, obj.strokecolor, obj.strokeweight );
        
        if ( $type( fn ) == 'function' ) {
            ( fn.$bind( this ) )( p );
            p.refresh();
        }

        return p;
    };

    var Grid = new Class( {
        initialize: function( par, fillcol, strokecol ) {
            this.parent       = par;
            this.min          = new Vector( 0.0, 0.0, 0.0 );
            this.max          = new Vector( 0.0, 0.0, 0.0 );
            this.scale        = new Vector( 1, 1, 1 );
            this.label        = new Vector( 'X', 'Y', 'Z' );
            this.delta        = new Vector();
            this.fillcolor    = fillcol;
            this.strokecolor  = strokecol;
            this.strokeweight = 1;
            this.plane        = [];
            this.line         = [];
            this.text         = [];
            this.parent.grid  = this;

            var i, j;
            for ( i = 0; i < 6; i++ ) {
                this.line[i] = new Array( 11 );
                this.text[i] = new Array( 11 );
            }
  
            if ( Client.hasSVG ) {
                for ( i = 0; i < 3; i++ ) {
                    this.parent.scene.appendChild( this.plane[i] = Scene.$c( 'path', {
                        'z-index': this.parent.zindex
                    } ) ); 
                }

                for ( i = 0; i < 6; i++ ) {
                    for ( j = 0; j < 11; j++ ) {
                        this.parent.scene.appendChild( this.line[i][j] = Scene.$c( 'line', {
                            'z-index':      this.parent.zindex + 1,
                            'stroke-width': 1
                        } ) );

                        this.parent.scene.appendChild( this.text[i][j] = Scene.$c( 'text', {
                            'width':       1,
                            'height':      20,
                            'font-family': 'Verdana',
                            'font-size':   '12px',
                            'z-index':     this.parent.zindex + 2,
                            'style':       'text-anchor:middle'
                        } ) );

                        this.text[i][j].appendChild( document.createTextNode( '' ) );
                    }
                }
            } else {
                for ( i = 0; i < 3; i++ ) {
                    this.parent.box_group.insertBefore( this.plane[i] = Scene.$c( 'v:shape', null, {
                        position: 'absolute',
                        left:     0,
                        top:      0,
                        width:    this.parent.box_group.style.width,
                        height:   this.parent.box_group.style.height,
                        zIndex:   this.parent.zindex
                    } ), null );
                }

                for ( i = 0; i < 6; i++ ) {
                    for ( j = 0; j < 11; j++ ) {
                        this.parent.box_group.insertBefore( this.line[i][j] = Scene.$c( 'v:line', {
                            'stroke-width': 1
                        }, {
                            position: 'absolute',
                            left:     0,
                            top:      0,
                            width:    this.parent.box_group.style.width,
                            height:   this.parent.box_group.style.height,
                            zIndex:   this.parent.zindex + 1
                        } ), null );

                        this.parent.box_group.insertBefore( this.text[i][j] = Scene.$c( 'div', null, {
                            position:   'absolute',
                            left:       0,
                            top:        0,
                            width:      100,
                            height:     20,
                            fontFamily: 'Verdana',
                            fontSize:   '12px',
                            textAlign:  'center',
                            zIndex:     this.parent.zindex + 2
                        } ), null );
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
            var scaleStr = function( j, g ) {
                return ( Math.abs( g ) >= 1 )? j : Math.round( 10 * j / g ) / Math.round( 10 / g );
            };

            var gridCalc = function( min, max, scale ) {
                var i, j, x, r, d, xr, g = new Array( 3 );

                if ( ( scale <= 1 ) || ( isNaN( scale ) ) ) {
                    d = max - min;
                    r = 1;

                    while ( Math.abs( d ) >= 100 ) {
                        d /= 10;
                        r *= 10;
                    }
    
                    while ( Math.abs( d ) < 10 ) {
                        d *= 10;
                        r /= 10;
                    }
 
                    d = ( ( Math.abs( d ) >= 50 )? 10 * r : ( ( Math.abs( d ) >= 20 )? 5 * r : 2 * r ) );
                } else {
                    d = Date.$interval( max - min );
                }

                x    = Math.floor( min / d ) * d;
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

            // draw planes
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
                    var xx, yy, vc, g, p, v;
                    var u = Client.hasSVG? 0 : 1;

                    p = new Vector( this.min.x, this.min.y, this.min.z );
                    p[plane] = config.cond? this.min[plane] : this.max[plane];

                    vc = this.parent.pos( p );
                    path = [[vc.x, vc.y]];

                    $each( [this.max[config.buildorder[0]], this.max[config.buildorder[1]], this.min[config.buildorder[2]]], function( v, k ) {
                        p[config.buildorder[k]] = v;
                        vc = this.parent.pos( p );
                        path.push( [vc.x, vc.y] );  
                    }.$bind( this ) );

                    p = new Vector();
                    p[plane] = 1;

                    this.plane[config.indices[0]].attr( {
                        'fill':         this.parent.getColor( this.fillcolor, this.fillcolor, p, config.cond? this.min : this.max ),
                        'stroke':       this.strokecolor,
                        'stroke-width': parseInt( this.strokeweight ),
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
                            switch ( plane ) {
                                case 'z':
                                    if ( k == 0 ) {
                                        p.x = j * this.parent.zoom.x;
                                        p.y = this.min.y;
                                    } else {
                                        p.x = this.min.x;
                                        p.y = j * this.parent.zoom.y;
                                    }

                                    break;

                                case 'y':
                                    if ( k == 0 ) {
                                        p.x = j * this.parent.zoom.x;
                                        p.z = this.min.z;
                                    } else {
                                        p.x = this.min.x;
                                        p.z = j * this.parent.zoom.z;
                                    }

                                    break;

                                case 'x':
                                    if ( k == 0 ) {
                                        p.y = j * this.parent.zoom.y;
                                        p.z = this.min.z;
                                    } else {
                                        p.y = this.min.y;
                                        p.z = j * this.parent.zoom.z;
                                    }

                                    break;
                            }

                            vc = this.parent.pos( p );
                            this.line[config.indices[k + 1]][i].attr( 'from', parseInt( vc.x ) + ',' + parseInt( vc.y ) );

                            xx   = vc.x;
                            yy   = vc.y;
                            v    = itconfig[k].dir2;
                            p[v] = this.max[v];
                            vc   = this.parent.pos( p );

                            this.line[config.indices[k + 1]][i].attr( {
                                to:         parseInt( vc.x ) + ',' + parseInt( vc.y ),
                                stroke:     this.strokecolor,
                                visibility: 'visible'
                            } );

                            this.text[config.indices[k + 1]][i].attr( $extend( { color: this.strokecolor, visibility: 'visible' }, ( itconfig[k].cond? {
                                x: Math.floor( xx + ( vc.x - xx ) * 1.06 ) - 50 * u,
                                y: Math.floor( yy + ( vc.y - yy ) * 1.06 ) -  7 * u
                            } : {
                                x: Math.floor( vc.x + ( xx - vc.x ) * 1.06 ) - 50 * u,
                                y: Math.floor( vc.y + ( yy - vc.y ) * 1.06 ) -  7 * u
                            } ) ) );

                            v = itconfig[k].dir3;

                            if ( ( i == 1 ) && ( this.label[v] ) ) {
                                this.text[config.indices[k + 1]][i].attr( 'innerText', this.label[v] );
                            } else {
                                if ( isNaN( this.scale[v] ) ) {
                                    this.text[config.indices[k + 1]][i].attr( 'innerText', ( $type( this.scale[v] ) == 'function' )? this.scale[v]( scaleStr( j, g[1] ) ) : scaleStr( j, g[1] ) + this.scale[v] );
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

                        while ( i < 11 ) {
                            this.line[config.indices[k + 1]][i].attr( 'visibility', 'hidden' );
                            this.text[config.indices[k + 1]][i].attr( 'visibility', 'hidden' );  
      
                            i++;
                        }
                    }
                } else {
                    this.plane[config.indices[0]].attr( 'visibility', 'hidden' );

                    for ( i = 0; i < 11; i++ ) {
                        this.line[config.indices[1]][i].attr( 'visibility', 'hidden' );
                        this.line[config.indices[2]][i].attr( 'visibility', 'hidden' );
                    }
                }
            }.$bind( this ) );

            return this;
        }
    } );


    var BaseObject = new Class( {
        initialize: function( par, frontcol, backcol, strokecol, strokeweight, center ) {
            this.parent       = par;
            this.frontcolor   = ( frontcol   || ( frontcol  == '' ) )? frontcol  : '#0080ff';
            this.backcolor    = ( backcol    || ( backcol   == '' ) )? backcol   : '#0000ff';
            this.strokecolor  = ( strokecol  || ( strokecol == '' ) )? strokecol : '#000000';
            this.strokeweight = strokeweight || 0;
            this.center       = center       || new Vector();
            this.poly3d       = [];

            // private function
            var self = this;
            function r( fi, c, ax ) {
                var fi_cos = Math.cos( fi * PI_DIV_180 );
                var fi_sin = Math.sin( fi * PI_DIV_180 );

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

            this.rotateX = function( fi, c ) {return r( fi, c, ['y', 'z'] );};
            this.rotateY = function( fi, c ) {return r( fi, c, ['z', 'x'] );};
            this.rotateZ = function( fi, c ) {return r( fi, c, ['x', 'y'] );};
        },

        setID: function( id ) {
            this.poly3d.$apply( 'id', id );
            return this;
        },

        bindEvent: function( name, fn ) {
            if ( fn ) {
                this.parent.callbacks[name] = fn;
            }

            $each( this.poly3d, function( v ) {
                v.callbacks[name] = fn;
            } );

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

        setVisibility: function( v ) {
            $each( this.poly3d, function( v ) {
                v.visibility = ( v && ( v != 'hidden' ) )? 'visible' : 'hidden';
            } );

            return this;
        }
    } );


    var Coord = new Class( {
        $extends: BaseObject,

        initialize: function( par, strokecol ) {
            this.$super( par, '', '', strokecol );

            this.poly3d.push( Poly.$c( this, function( p ) {
                p.pointAdd( [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]] );
            } ) );

            if ( strokecol == '' ) {
                this.setVisibility( false );
            }
        },

        transform: function( vc ) {
            var p = this.poly3d[0];
            var v = new Vector( p.point[0].x, p.point[0].y, p.point[0].z );
            v.add( ( p.point[1].x - p.point[0].x ) * vc.x + ( p.point[2].x - p.point[0].x ) * vc.y + ( p.point[3].x - p.point[0].x ) * vc.z, 
                   ( p.point[1].y - p.point[0].y ) * vc.x + ( p.point[2].y - p.point[0].y ) * vc.y + ( p.point[3].y - p.point[0].y ) * vc.z,
                   ( p.point[1].z - p.point[0].z ) * vc.x + ( p.point[2].z - p.point[0].z ) * vc.y + ( p.point[3].z - p.point[0].z ) * vc.z );

            return v;
        }
    } );


    var objects = ( function() {
        var setBoxPlane = function( p, key, x0, y0, z0, x1, y1, z1 ) {
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

        var torusPoint = function( phi, theta, r, r2 ) {
            var dr = r2 * Math.sin( phi );

            return {
                x: ( r + dr ) * Math.sin( theta ),
                y: ( r + dr ) * Math.cos( theta ),
                z: r2 * Math.cos( phi )
            };
        };


        // predefined objects, sorted alphabetically

        return {
            Box: new Class( {
                $extends: BaseObject,

                initialize: function( par, frontcol, backcol, strokecol, strokeweight, x0, y0, z0, x1, y1, z1 ) {
                    this.$super( par, frontcol, backcol, strokecol, strokeweight, new Vector( ( x0 + x1 ) / 2, ( y0 + y1 ) / 2, ( z0 + z1 ) / 2 ) );

                    this.poly3d = [
                        Poly.$c( this, function( p ) {p.pointAdd( [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]] );} ),
                        Poly.$c( this, function( p ) {p.pointAdd( [[x0, y0, z1], [x0, y1, z1], [x1, y1, z1], [x1, y0, z1]] );} ),
                        Poly.$c( this, function( p ) {p.pointAdd( [[x0, y0, z1], [x1, y0, z1], [x1, y0, z0], [x0, y0, z0]] );} ),
                        Poly.$c( this, function( p ) {p.pointAdd( [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]] );} ),
                        Poly.$c( this, function( p ) {p.pointAdd( [[x0, y1, z0], [x0, y1, z1], [x0, y0, z1], [x0, y0, z0]] );} ),
                        Poly.$c( this, function( p ) {p.pointAdd( [[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]] );} )
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
                $extends: BaseObject,

                initialize: function( par, strokecol, strokeweight, x0, y0, z0, x1, y1, z1, x0col, y0col, z0col, x1col, y1col, z1col ) {
                    this.$super( par, '', '', strokecol, strokeweight, new Vector( ( x0 + x1 ) / 2, ( y0 + y1 ) / 2, ( z0 + z1 ) / 2 ) );

                    this.x0col = x0col;
                    this.x1col = x1col;
                    this.y0col = y0col;
                    this.y1col = y1col;
                    this.z0col = z0col;
                    this.z1col = z1col;
                
                    var i = 0;

                    $each( [this.z0col, this.z1col, this.y0col, this.y1col, this.x0col, this.x1col], function( val, key ) {
                        if ( val != '#000000' ) {
                            this.poly3d[i] = Poly.$c( $extend( this, {
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

            Cube: new Class( {
                $extends: BaseObject,

                initialize: function( par, frontcol, backcol, strokecol, strokeweight, a ) {
                    this.$super( par, frontcol, backcol, strokecol, strokeweight );
            
                    var a = a || 50;

                    this.poly3d = [
                        Poly.$c( this, function( p ) {p.pointAdd( [[-a, -a,  a], [ a, -a,  a], [ a, -a, -a], [-a, -a, -a]] );} ),
                        Poly.$c( this, function( p ) {p.pointAdd( [[-a,  a, -a], [-a,  a,  a], [-a, -a,  a], [-a, -a, -a]] );} ),
                        Poly.$c( this, function( p ) {p.pointAdd( [[-a,  a,  a], [ a,  a,  a], [ a, -a,  a], [-a, -a,  a]] );} ),
                        Poly.$c( this, function( p ) {p.pointAdd( [[ a,  a, -a], [ a,  a,  a], [-a,  a,  a], [-a,  a, -a]] );} ),
                        Poly.$c( this, function( p ) {p.pointAdd( [[ a, -a,  a], [ a,  a,  a], [ a,  a, -a], [ a, -a, -a]] );} ),
                        Poly.$c( this, function( p ) {p.pointAdd( [[ a, -a, -a], [ a,  a, -a], [-a,  a, -a], [-a, -a, -a]] );} )
                    ];
                }
            } ),

            Dodecahedron: new Class( {
                $extends: BaseObject,

                initialize: function( par, frontcol, backcol, strokecol, strokeweight, a, b, c ) {
                    this.$super( par, frontcol, backcol, strokecol, strokeweight );

                    var a = a || 1.0 / ( 1.0 + Math.sqrt( 5.0 ) );
                    var b = b || ( 1.0 + Math.sqrt( 5.0 ) ) / 4.0;
                    var c = c || 0.5;

                    this.poly3d = [
                        Poly.$c( this, function( p, o ) {p.pointAdd( [[-c, -c,  c], [-b,  0,  a], [-c,  c,  c], [ 0,  a,  b], [ 0, -a,  b]] );} ),
                        Poly.$c( this, function( p, o ) {p.pointAdd( [[ 0, -a,  b], [ 0,  a,  b], [ c,  c,  c], [ b,  0,  a], [ c, -c,  c]] );} ),
                        Poly.$c( this, function( p, o ) {p.pointAdd( [[ c, -c, -c], [ b,  0, -a], [ c,  c, -c], [ 0,  a, -b], [ 0, -a, -b]] );} ),
                        Poly.$c( this, function( p, o ) {p.pointAdd( [[-c,  c, -c], [-b,  0, -a], [-c, -c, -c], [ 0, -a, -b], [ 0,  a, -b]] );} ),
                        Poly.$c( this, function( p, o ) {p.pointAdd( [[ c, -c, -c], [ a, -b,  0], [ c, -c,  c], [ b,  0,  a], [ b,  0, -a]] );} ),
                        Poly.$c( this, function( p, o ) {p.pointAdd( [[ b,  0, -a], [ b,  0,  a], [ c,  c,  c], [ a,  b,  0], [ c,  c, -c]] );} ),
                        Poly.$c( this, function( p, o ) {p.pointAdd( [[-b,  0, -a], [-b,  0,  a], [-c, -c,  c], [-a, -b,  0], [-c, -c, -c]] );} ),
                        Poly.$c( this, function( p, o ) {p.pointAdd( [[-c,  c, -c], [-a,  b,  0], [-c,  c,  c], [-b,  0,  a], [-b,  0, -a]] );} ),
                        Poly.$c( this, function( p, o ) {p.pointAdd( [[ c,  c,  c], [ 0,  a,  b], [-c,  c,  c], [-a,  b,  0], [ a,  b,  0]] );} ),
                        Poly.$c( this, function( p, o ) {p.pointAdd( [[ a,  b,  0], [-a,  b,  0], [-c,  c, -c], [ 0,  a, -b], [ c,  c, -c]] );} ),
                        Poly.$c( this, function( p, o ) {p.pointAdd( [[ a, -b,  0], [-a, -b,  0], [-c, -c,  c], [ 0, -a,  b], [ c, -c,  c]] );} ),
                        Poly.$c( this, function( p, o ) {p.pointAdd( [[ c, -c, -c], [ 0, -a, -b], [-c, -c, -c], [-a, -b,  0], [ a, -b,  0]] );} )
                    ];
                }
            } ),

            Icosahedron: new Class( {
                $extends: BaseObject,

                initialize: function( par, frontcol, backcol, strokecol, strokeweight, a, b ) {
                    this.$super( par, frontcol, backcol, strokecol, strokeweight );

                    var a = a || 0.5;
                    var b = b || 1.0 / ( 1.0 + Math.sqrt( 5.0 ) );

                    this.poly3d = [
                        Poly.$c( this, function( p ) {p.pointAdd( [[ 0,  b, -a], [ b,  a,  0], [-b,  a,  0]] );} ),
                        Poly.$c( this, function( p ) {p.pointAdd( [[ 0,  b,  a], [-b,  a,  0], [ b,  a,  0]] );} ),
                        Poly.$c( this, function( p ) {p.pointAdd( [[ 0,  b,  a], [ 0, -b,  a], [-a,  0,  b]] );} ),
                        Poly.$c( this, function( p ) {p.pointAdd( [[ 0,  b,  a], [ a,  0,  b], [ 0, -b,  a]] );} ),
                        Poly.$c( this, function( p ) {p.pointAdd( [[ 0,  b, -a], [ 0, -b, -a], [ a,  0, -b]] );} ),
                        Poly.$c( this, function( p ) {p.pointAdd( [[ 0,  b, -a], [-a,  0, -b], [ 0, -b, -a]] );} ),
                        Poly.$c( this, function( p ) {p.pointAdd( [[ 0, -b,  a], [ b, -a,  0], [-b, -a,  0]] );} ),
                        Poly.$c( this, function( p ) {p.pointAdd( [[ 0, -b, -a], [-b, -a,  0], [ b, -a,  0]] );} ),
                        Poly.$c( this, function( p ) {p.pointAdd( [[-b,  a,  0], [-a,  0,  b], [-a,  0, -b]] );} ),
                        Poly.$c( this, function( p ) {p.pointAdd( [[-b, -a,  0], [-a,  0, -b], [-a,  0,  b]] );} ),
                        Poly.$c( this, function( p ) {p.pointAdd( [[ b,  a,  0], [ a,  0, -b], [ a,  0,  b]] );} ),
                        Poly.$c( this, function( p ) {p.pointAdd( [[ b, -a,  0], [ a,  0,  b], [ a,  0, -b]] );} ),
                        Poly.$c( this, function( p ) {p.pointAdd( [[ 0,  b,  a], [-a,  0,  b], [-b,  a,  0]] );} ),
                        Poly.$c( this, function( p ) {p.pointAdd( [[ 0,  b,  a], [ b,  a,  0], [ a,  0,  b]] );} ),
                        Poly.$c( this, function( p ) {p.pointAdd( [[ 0,  b, -a], [-b,  a,  0], [-a,  0, -b]] );} ),
                        Poly.$c( this, function( p ) {p.pointAdd( [[ 0,  b, -a], [ a,  0, -b], [ b,  a,  0]] );} ),
                        Poly.$c( this, function( p ) {p.pointAdd( [[ 0, -b, -a], [-a,  0, -b], [-b, -a,  0]] );} ),
                        Poly.$c( this, function( p ) {p.pointAdd( [[ 0, -b, -a], [ b, -a,  0], [ a,  0, -b]] );} ),
                        Poly.$c( this, function( p ) {p.pointAdd( [[ 0, -b,  a], [-b, -a,  0], [-a,  0,  b]] );} ),
                        Poly.$c( this, function( p ) {p.pointAdd( [[ 0, -b,  a], [ a,  0,  b], [ b, -a,  0]] );} )
                    ];
                }
            } ),

            Line: new Class( {
                $extends: BaseObject,

                initialize: function( par, strokecol, strokeweight, x0, y0, z0, x1, y1, z1 ) {
                    this.$super( par, '', '', strokecol, strokeweight, new Vector( ( x0 + x1 ) / 2, ( y0 + y1 ) / 2, ( z0 + z1 ) / 2 ) );

                    this.poly3d.push( Poly.$c( this, function( p ) {
                        p.pointAdd( [[x0, y0, z0], [x1, y1, z1]] );
                    } ) );
                }
            } ),

            Octahedron: new Class( {
                $extends: BaseObject,

                initialize: function( par, frontcol, backcol, strokecol, strokeweight, a, b ) {
                    this.$super( par, frontcol, backcol, strokecol, strokeweight );

                    var a = a || Math.sqrt( 0.125 );
                    var b = b || 0.5;

                    this.poly3d = [
                        Poly.$c( this, function( p ) {p.pointAdd( [[-a, 0,  a], [-a, 0, -a], [0,  b, 0]] );} ),
                        Poly.$c( this, function( p ) {p.pointAdd( [[-a, 0, -a], [ a, 0, -a], [0,  b, 0]] );} ),
                        Poly.$c( this, function( p ) {p.pointAdd( [[ a, 0, -a], [ a, 0,  a], [0,  b, 0]] );} ),
                        Poly.$c( this, function( p ) {p.pointAdd( [[ a, 0,  a], [-a, 0,  a], [0,  b, 0]] );} ),
                        Poly.$c( this, function( p ) {p.pointAdd( [[ a, 0, -a], [-a, 0, -a], [0, -b, 0]] );} ),
                        Poly.$c( this, function( p ) {p.pointAdd( [[-a, 0, -a], [-a, 0,  a], [0, -b, 0]] );} ),
                        Poly.$c( this, function( p ) {p.pointAdd( [[ a, 0,  a], [ a, 0, -a], [0, -b, 0]] );} ),
                        Poly.$c( this, function( p ) {p.pointAdd( [[-a, 0,  a], [ a, 0,  a], [0, -b, 0]] );} )
                    ];
                }
            } ),

            Spline: new Class( {
                $extends: BaseObject,

                initialize: function( par, frontcol, backcol, strokecol, strokeweight, bsi ) {
                    this.$super( par, frontcol, backcol, strokecol, strokeweight );

                    var bsi = bsi || 4;

                    for ( x = -50, p1 = 0; x <= ( 50 - bsi ); x += bsi, p1++ ) {
                        this.poly3d[p1] = Poly.$c( this, function( p ) {
                            p.pointAdd( [[x, x, x], [x + bsi, x + bsi, x + bsi]] );
                        } );
                    }
                }
            } ),

            Tetrahedron: new Class( {
                $extends: BaseObject,

                initialize: function( par, frontcol, backcol, strokecol, strokeweight, a ) {
                    this.$super( par, frontcol, backcol, strokecol, strokeweight );

                    var a = a || 50;

                    this.poly3d = [
                        Poly.$c( this, function( p ) {p.pointAdd( [[ a,  a,  a], [-a,  a, -a], [ a, -a, -a]] );} ),
                        Poly.$c( this, function( p ) {p.pointAdd( [[-a,  a, -a], [-a, -a,  a], [ a, -a, -a]] );} ),
                        Poly.$c( this, function( p ) {p.pointAdd( [[ a,  a,  a], [ a, -a, -a], [-a, -a,  a]] );} ),
                        Poly.$c( this, function( p ) {p.pointAdd( [[ a,  a,  a], [-a, -a,  a], [-a,  a, -a]] );} )
                    ];
                }
            } ),

            TorusX: new Class( {
                $extends: BaseObject,

                initialize: function( par, frontcol, backcol, strokecol, strokeweight, r, n, r2, n2 ) {
                    this.$super( par, frontcol, backcol, strokecol, strokeweight );

                    var d = -1;

                    for ( var s = 0; s < n2 * n - d; s++ ) {
                        this.poly3d[s] = Poly.$c( this, function( p ) {
                            var tp;

                            for ( var i = 0, q = [s, s + 1, s + n2 + 1, s + n2]; i < q.length; i++ ) {
                                tp = torusPoint( 2  * Math.PI * q[i] * n / ( n2 * n - d ), 2  * Math.PI * q[i] / ( n2 * n - d ), r, r2 );
                                p.pointAdd( tp.z, tp.x, tp.y );
                            }
                        } );
                    }
               }
            } ),

            TorusZ: new Class( {
                $extends: BaseObject,

                initialize: function( par, frontcol, backcol, strokecol, strokeweight, r, n, r2, n2 ) {
                    this.$super( par, frontcol, backcol, strokecol, strokeweight );

                    var d = -1;
                    var m = ( 2 * n2 - 1 ) * ( 2 * n - 1 ) - d;

                    for ( var s = 0; s < m / 2; s++ ) {
                        this.poly3d[s] = Poly.$c( this, function( p ) {
                            var tp;

                            for ( var i = 0, q = [2 * s + 1, 2 * s + ( 2 * n2 - 1 ) + 2, 2 * s + 2 * ( 2 * n2 - 1 ) + 1, 2 * s + ( 2 * n2 - 1 )]; i < q.length; i++ ) {
                                tp = torusPoint( ( 2 * n - 1 ) * 2 * Math.PI * q[i] / m, 2 * Math.PI * q[i] / m, r, r2 );
                                p.pointAdd( tp.x, tp.y, tp.z );
                            }
                        } );
                    }
                }
            } )
        };
    } )();


    // expose
    window.Filippo = {
        Client:     Client,
        Util:       Util,
        Vector:     Vector,
        Scene:      Scene,
        Poly:       Poly,
        Grid:       Grid,
        BaseObject: BaseObject,
        Coord:      Coord,

        // pre-defined objects
        objects:    objects
    };
} )();