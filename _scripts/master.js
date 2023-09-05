<!--

/*  ************************************************************************  *
 *                                 master.js                                  *
 *  ************************************************************************  */

/*  Load as the first script in the HEAD of every document page. Do not add 
    the DEFER attribute! 

    Historically, this script was also the first even in non-document pages, 
    notably the one BANNER.HTM and the several TOC.HTM. The different pages 
    each loaded MASTER.JS but followed with different other scripts. The 
    point to MASTER.JS was that it provided whatever is common to all types 
    of page. 

    Since 2021, the only non-document page that ever loads MASTER.JS is the 
    long-retired VIEWER.HTM and only then for the very particular reason 
    that its VIEWER.JS replaces DOCUMENT.JS for just this one page.  */

/*  ************************************************************************  */
/*  Background                                                                */

/*  This site presents documents with a banner and a Table of Contents (TOC) 
    without needing that the documents themselves be prepared with any 
    knowledge of their re-presentation beyond loading this script and 
    DOCUMENT.JS and the corresponding stylesheets. 

    Do not neglect the preceding paragraph! It is very important, both for 
    the author's preparation of content and so that every page presents 
    acceptably even for readers who disable scripts. 

    When a document page is loaded directly, its DOCUMENT.JS constructs a 
    viewer for the document's original body. Long ago, this viewer was 
    written as FRAMESET and FRAME tags in the HTML of VIEWER.HTM. Later, a 
    slightly redesigned frameset got built by scripts. Since 2021, it is 
    reinterpreted as DIV and IFRAME elements built by scripts. 

    Ideally, MASTER.JS has no knowledge of the viewer but it is affected 
    indirectly because its functions and variables exist to be accessible 
    from other scripts but the means of access depends on whether those 
    scripts run in a document or non-document page. 

    Document pages load MASTER.JS and DOCUMENT.JS, necessarily, and may load 
    more. All these scripts run - straightforwardly - in the browser context 
    that the document was loaded into. To them, the object named window, 
    with a lower-case w, is always and necessarily this browser context. 
    Some functions defined in MASTER.JS take Window, with an upper-case W, 
    as an argument. This window can be either the document's own browsing 
    context or that of a non-document page in the viewer. 

    The banner and TOC pages - collectively the non-document pages - load 
    BANNER.JS and TOC.JS, respectively. They too may load more scripts. In 
    the expected circumstances, these pages are loaded into an IFRAME and 
    their scripts run in the nested browser context. To them, the object 
    named window is the browser context of their IFRAME. They have access to 
    MASTER.JS through their window object's top window.  */

/*  Background                                                                */
/*  ************************************************************************  */
/*  Configuration                                                             */

/*  To give some sense of order to the scripts' many configurable constants, 
    and so that they do not pollute the window object, define them as 
    properties of a Config object. This is a rough simulation of a C++ 
    namespace, though without the flexibility of the using statement. 

    That modern JavaScript has a "const" keyword which meets the goal 
    confirms the wider desirability - but it's something of a hack, notably 
    for introducing that typeof can throw, and there's no obvious way to use 
    it for new browsers without making syntax errors for old browsers. 

    TO DO:

    These scripts' increasingly many global functions arguably pollute the 
    window object even more than do the variables. Perhaps the better 
    argument is for doing nothing about either. After all, these scripts 
    will never co-exist with anyone else's. Still, as a low priority, think 
    about namespaces for the functions too.  */

var Config = {};

/*  ===============  */
/*  Site Properties  */

/*  Filename for default document on any path - must be in lower case  */

Config.DefaultFilename = "index.htm";

/*  Domain name of author's intranet and essential subdomain for any 
    recognised host on the Internet = must be in lower case 

    Note, by the way, that use of BaseDomain to initialise other variables 
    prevents the use of the literal syntax for defining variables as Config 
    members.  */

Config.BaseDomain = "geoffchappell";

Config.LiveDomain = "www." + Config.BaseDomain + ".com";

/*  Ideally, the viewer's re-presentation of documents would work wherever 
    the site is hosted. In reality, the viewer's determination of the 
    correct TOC to show for a document page depends on absolute pathnames. 
    It breaks if the host's copy of this site is deeper into the host's 
    directory tree than at any real site (whether live on the Internet or 
    just on an intranet for testing or for my private use). 

    This is particularly a problem with copies made by browsers to save a 
    page and by search engines to serve as if cached, but it's also seen 
    when pages are reproduced whole to be read at someone else's website. 
    Why anyone does this rather than link to the original, I don't know, but 
    I can't help notice that such reproduction often has no acknowledgement 
    or at least not a prominent acknowlegement. Saving and caching might be 
    cared about, but other reproduction too often looks like theft. 

    I don't see it as properly my burden to accommodate any of this. Without 
    the assurance of being run at a recognised host, no scripts run 
    non-trivially. 

    A hostname (such as read from a location object) counts as recognised if 
    it either is the canonical domain or contains the canonical domain as a 
    subdomain. If we take as granted that the hostname is a period-separated 
    sequence of one or more subdomains, then it's recognised if the 
    characters before and after the canonical name, if any, are periods. 

    THINK: 

    Using a regular expression just for this may easily be overkill.  */

Config.RecognisedHostName = new RegExp (
    "(^|\\.)" + Config.BaseDomain + "($|\\.)", 
    "i");

/*  While on the subject of access that I prefer not to support... 

    For one reason or another, I have sometimes thought to block links from 
    specific other sites. For each, all attempted access that names this 
    other site as the referrer gets redirected to an explanatory note. 

    Of course, these sites and their users have learnt over time to get 
    round this simple roadblock. Even so, it costs little to make the point, 
    even if only sporadically.  */

Config.BadReferrer = function (Source, Target) {
    this.Source = Source;
    this.Target = Target;
    this.Pattern = null;
}

Config.BadReferrer.prototype.Match = function (Referrer) 
{
    /*  The Source that's given at construction specifies the most 
        significant subdomains to find in a Referrer (which is a URL). 
        Testing against a regular expression may easily be overkill. Anyway, 
        since the Referrer will almost always never be "bad", first check 
        quickly whether the Referrer even contains the Source.  */

    if (Referrer.indexOf (this.Source) == -1) return null;

    if (this.Pattern == null) {
        this.Pattern = new RegExp (
            "^([^\\.\\/:]+:\\/\\/)?([^\\/]+\\.)?" 
                + this.Source 
                + "($|#|\\/|\\?)", 
            "i");
    }
    return this.Pattern.test (Referrer) ? this.Target : null;
};

Config.BadReferrers = [
    new Config.BadReferrer (
        "msfn.org", 
        "/redirect/msfn.htm"),
    new Config.BadReferrer (
        "experts-exchange.com", 
        "/redirect/experts-exchange.htm")
];

/*  =======  */
/*  Subwebs  */

/*  The site is organised as a collection of subwebs. Originally, each 
    actually was a subweb in the sense of Microsoft's Front Page. What 
    persists of this is that there's a separate TOC for each subweb. The 
    following is the definitive list of subwebs. All the paths must be 
    absolute and in lower case.  */

Config.Subweb = function (Path, Name)
{
    this.Path = Path;
    this.Name = Name;
    this.PathLength = Path.length;
}

Config.Subweb.prototype.Match = function (Pathname) {

    /*  To match, the given Pathname (assumed to begin with a forward slash, 
        as if from the pathname of a location object) must begin with the 
        subweb's Path. It can be the whole of the Path or it can continue 
        with a forward slash. 

        When the given Pathname does not begin with the subweb's Path, the 
        code below will wastefully search the whole of the given Pathname 
        for an unlikely (and unwanted) occurrence of the Path deeper in. 
        This would ordinarily, e.g., in C, be regarded as very poor 
        programming. Here the (possibly wrong) assumption is that whatever 
        the waste, this one call detects almost all mismatches and the 
        browser is very much faster inside this one call than is possible 
        with any seemingly better algorithm (which must also call the 
        browser but then must work locally to detect the mismatch).  */

    if (Pathname.indexOf (this.Path) != 0) return false;
    return Pathname.length == this.PathLength 
        || Pathname.charAt (this.PathLength) == "/";
};

Config.Subwebs = [
    new Config.Subweb ("/notes", "Notes"),
    new Config.Subweb ("/studies/windows/km", "Kernel"),
    new Config.Subweb ("/studies/windows/win32", "Win32"),
    new Config.Subweb ("/studies/windows/shell", "Shell"),
    new Config.Subweb ("/studies/windows/ie", "Internet Explorer"),
    new Config.Subweb ("/studies/msvc", "Visual C++")
];

/*  The root could be listed as the last subweb (with a small accommodation 
    in the matching function). Relevant code anyway has it as the default.  */

Config.HomeSubweb = new Config.Subweb ("/", "Home");

/*  =================  */
/*  URL Search String  */

/*  That the TOC can be expanded and collapsed according to the reader's 
    changing interests (which need not be explicitly anticipated by the 
    author) is a paramount consideration in the TOC's design, if not of the 
    whole website. The only place to carry this and other such state through 
    a navigation without resorting to such techniques as saving cookies on 
    the reader's computer is the URL search string. Here is the master list 
    of (case-sensitive) search-string arguments:  */

Config.UrlArguments = {
    Bookmark:       "bm",           // long obsolete - only in VIEWER.JS 
    Document:       "doc",          // long obsolete - only in VIEWER.JS 
    NoScript:       "noscript",
    NoViewer:       "noviewer",
    TocAlignment:   "ta",
    TocScroll:      "ts",
    TocWidth:       "tw",
    TocExpansion:   "tx"
};

/*  ===========  */
/*  Class Names  */

/*  All the following names are either expected in CLASS attributes in the 
    HTML as written or may be added by scripts. All are styled in MASTER.CSS 
    but can have implications for other stylesheets too. Obviously, names 
    must agree between scripts and stylesheets.  */

Config.Classes = {

    /*  The site must never depend on scripts to run. To compensate for 
        missing navigational support if scripts don't run, all pages are 
        prepared with at least a design-time inclusion that presents a 
        simulated banner which links to an appropriate TOC. This and 
        anything else that has NoScript in its CLASS is meant to be seen 
        only if scripts don't run. If scripts do run, they arrange that all 
        DOM nodes that have NoScript in their CLASS get hidden.  */

    NoScript: "NoScript", 

    /*  More recently, this conditional display has got elaborated in 
        various ways. The following is similar to NoScript but with the 
        intention that the hiding is merely temporary. The expectation is 
        that some script "owns" the hidden material and will un-hide it 
        later, possibly in response to user-interface activity.  */

    Deferrable: "Deferrable", 

    /*  An opposite of NoScript has been developed. This CLASS is for 
        material that is to show only if scripts do run.  */

    ScriptOnly: "ScriptOnly", 

    /*  The stylesheets "know" whether scripts have run because we 
        eventually set the following class for the HTML node (or nodes, 
        since we have them in frames too).  */

    Scripted: "Scripted", 

    /*  Large parts of the DOM are hidden while significant reworking is in 
        progress for a page's initial presentation. The notable cases are 
        the building of the viewer and of the TOC. */

    UnderConstruction: "UnderConstruction"
};

/*  Configuration                                                             */
/*  ************************************************************************  */
/*  Browser Variations                                                        */

/*  Some work must be done differently for different browsers according to 
    what functionality appears to be available. 

    One tack is to edit standards-compliant functionality into the relevant 
    prototype on discovering that the browser implements it differently. If 
    you tend to think the standards are standard because of some inate 
    superiority, then back-fitting the functionality has much to commend it. 

    Back in 2007, these scripts did this for a few built-in JavaScript 
    objects that didn't have the full support of Internet Explorer 5, but by 
    the time I started thinking about browsers other than Internet Explorer 
    I didn't think the case was so clear for anyone's implementation of the 
    DOM (and I no longer cared about Internet Explorer 5). I instead wrapped 
    standard and non-standard into my own utility functions. For better or 
    worse, I stick with this.  */

/*  **********  */
/*  JavaScript  */

/*  Inevitably, modern JavaScript has built-in objects and methods that 
    never have been built in to Internet Explorer. Some are useful - and 
    even immediately useful. 

    WARNING: 

    The style here is to define the helper function differently according to 
    whether the built-in object has a suitable modern method. Folklore on 
    the Internet would have it that some browsers in some configurations may 
    scope each function to its conditional block. As with all folklore, 
    there's surely some truth in it, yet never enough information even for 
    cursory appraisal.  */

/*  ======  */
/*  Arrays  */

/*  The first two helpers map neatly to the modern JavaScript methods 
    includes and indexOf. The aim is not to re-implement the modern methods 
    on old browsers but to use the modern methods for what functionality is 
    wanted whatever the browser.  */

if (typeof Array.prototype.includes == "function") {

    function ArrayIncludes (Array, Element)
    {
        return Array.includes (Element);
    }
}
else {

    function ArrayIncludes (Array, Element)
    {
        var count = Array.length;
        for (var n = 0; n < count; n ++) {
            if (Array [n] == Element) return true;
        }
        return false;
    }
}

if (typeof Array.prototype.indexOf == "function") {

    function ArrayIndexOf (Array, Element)
    {
        return Array.indexOf (Element);
    }
}
else {

    function ArrayIndexOf (Array, Element)
    {
        var count = Array.length;
        for (var n = 0; n < count; n ++) {
            if (Array [n] == Element) return n;
        }
        return -1;
    }
}

/*  Though not wanted originally, helpers modelled on the find, findIndex 
    and forEach method are not without usefulness (though we presently do 
    not have a use for ArrayFind).  */

if (typeof Array.prototype.findIndex == "function") {

    function ArrayFindIndex (Array, Callback) 
    {
        return Array.findIndex (Callback);
    }
}
else {

    function ArrayFindIndex (Array, Callback)
    {
        var count = Array.length;
        for (var n = 0; n < count; n ++) {
            if (Callback (Array [n], n, Array)) return n;
        }
        return -1;
    }
}

if (typeof Array.prototype.forEach == "function") {

    function ArrayForEach (Array, Callback)
    {
        Array.forEach (Callback);
    }
}
else {

    function ArrayForEach (Array, Callback)
    {
        var count = Array.length;
        for (var n = 0; n < count; n ++) {
            var x = Array [n];
            if (x) Callback (x, n, Array);
        }
    }
}

/*  The following two helper functions are much more this one writer's idea 
    of utility than of accommodating browser variations. Both look through 
    the Array for the first element that meets some condition that is tested 
    by a callback function - but their purpose is relatively narrow such 
    that methods like "find" from modern JavaScript look like overkill. 

    For both, the assumption is that the Array is regular: all elements are 
    the same type of object and the Callback is most usefully a method of 
    this object. Its one argument is the given Context for all elements. The 
    Callback for FindInArray returns a boolean, with true meaning that the 
    currently enumerated element is the one that was to be found. The 
    Callback for LookupInArray returns a non-null value that has been looked 
    up from the found element. 

    It may easily be that both are more trouble than they're worth.  */

if (typeof Array.prototype.find == "function") {

    function FindInArray (Array, Callback, Context)
    {
        var callback = function (Element) {
            return Callback.call (Element, Context);
        };
        return Array.find (callback);
    }

    function LookupInArray (Array, Callback, Context)
    {
        var result = null;
        var callback = function (Item) {
            result = Callback.call (Item, Context);
            return result != null;
        };
        var found = Array.find (callback);
        return found != null ? result : null;
    }
}
else {

    function FindInArray (Array, Callback, Context)
    {
        var count = Array.length;
        for (var n = 0; n < count; n ++) {
            var x = Array [n];
            if (Callback.call (x, Context)) return x;
        }
        return null;
    }

    function LookupInArray (Array, Callback, Context)
    {
        var count = Array.length;
        for (var n = 0; n < count; n ++) {
            var result = Callback.call (Array [n], Context);
            if (result != null) return result;
        }
        return null;
    }
}

/*  =======  */
/*  Strings  */

/*  Though Internet Explorer versions up to and including 7.0 allow the [] 
    syntax for indexing into a string, they produce undefined as the result. 
    There is arguably nothing to do for these versions except to rely on the 
    charAt method. Fortunately, charAt looks to have the support of all 
    browsers and so the best accommodation may be to remember - always - to 
    use charAt wherever indexing is tempting. No variation required!  */

/*  ==================  */
/*  Object Inheritance  */

/*  Simulated inheritance is neater if the built-in Object object has the 
    create method - but Internet Explorer doesn't have it until version 9. 
    We could back-fit it, but we anyway can do with a utility function that 
    does the little bit extra of linking prototype chains so that one object 
    looks to be Derived from a Base. 

    The typical use is that a script's first execution calls this utility 
    function for each derivation (before defining any methods on the derived 
    object's prototype). Note that this is only half the work: it still 
    leaves each Derived object's constructor to call the Base object's 
    constructor.  */

if (typeof Object.create == "function") {

    function SetObjectInheritance (Derived, Base)
    {
        var newbaseproto = Object.create (Base.prototype);
        Derived.prototype = newbaseproto;
        newbaseproto.constructor = Derived;
    }
}
else {

    function SetObjectInheritance (Derived, Base)
    {
        function baseproto () {
        };
        baseproto.prototype = Base.prototype;
        var newbaseproto = new baseproto ();
        Derived.prototype = newbaseproto;
        newbaseproto.constructor = Derived;
    }
}

/*  ======  */
/*  Events  */

/*  Event handling is a significant and recurring source of disagreement 
    between browsers and standards! 

    The model that was developed for Internet Explorer (but not adopted for 
    what became standard) has built into it that a browsing context services 
    only one event at any one time. Not unnaturally, the handler takes no 
    argument but instead gets its Event object from the window object. 

    The standard, also implemented in Internet Explorer 9 and higher, is 
    just as much single-threaded but perhaps recognises that it needn't be 
    and anticipates that it won't always be. It has the handler receive its 
    Event object as an argument. 

    The two models also give their handlers different "this" references. The 
    standard plumbs for the target. Internet Explorer had it - naturally, 
    and even correctly for functions at global scope, but less usefully - as 
    the window. 

    In the scheme below, callers supply a Handler that fits the standard 
    for an event listener. This handler can assume that Event is available 
    as the one argument. It can also assume (but we never do) that "this" is 
    the object that the handler was set on or added to.  */

/*  --------  */
/*  A helper  */
/*  --------  */

/*  For old Internet Explorer, a helper that finds which window object has 
    the event object that describes an event at the given Target  */

function GetWindow (Target) 
{
    /*  Is the target a window?  */

    if (Target.window == Target) return Target;

    /*  Otherwise, assume the target is a node in the DOM tree of some 
        document or is the document object itself.  */
        
    var d = Target.ownerDocument;
    if (d == null) d = Target;

    /*  If this function somehow gets called for a modern browser, the 
        document has a property that tells which window the document is 
        viewed through.  */

    var w = d.defaultView;
    if (w != null) return w;

    /*  Before Internet Explorer 9, check the known windows for the one 
        that has the document.  */

    if (window.document == d) return window;

    var frames = window.frames;
    var count = frames.length;
    for (var n = 0; n < count; n ++) {
        w = frames [n];
        if (w.document == d) return w;
    }

    /*  If we ever get here, there are still things we might try, but enough 
        is seriously wrong that we might better give up.  */

    return null;
}

/*  ------------  */
/*  Registration  */
/*  ------------  */

/*  Call the following to add a standards-compliant event listener even if 
    what's done inside is to attach an event handler. What's returned is 
    either the event listener as given or the event handler as confected. 
    Whichever it is, treat it as a cookie to give to UnregisterEventHandler 
    if ever the listening or handling is to stop.  */

function RegisterEventHandler (Target, EventName, Handler)
{
    /*  If the Target looks like it has the browser's support for the 
        standard method, use it and be happy.  */

    if (Target.addEventListener != null) {
        Target.addEventListener (EventName, Handler, false);
        return Handler;
    }

    /*  Otherwise, if we have the method from before Internet Explorer 9, 
        attach a stub that calls the given Handler with the given Target as 
        its "this" and with the right window's event property as the 
        argument. Note that attachEvent, unlike addEventListener, can fail.  */

    if (Target.attachEvent != null) {

        /*  See that we get the window for the Target only here when 
            attaching a handler. The assumption is that the Target stays 
            put. If it is removed from one DOM tree to insert into some 
            other that shows through a different window, thenit is the 
            caller's responsibility to detach the handler and re-attach!  */

        var w = GetWindow (Target);
        if (w == null) return null;

        var handler = function () {
            Handler.call (Target, w.event);
        };
        if (Target.attachEvent ("on" + EventName, handler)) return handler;
    }

    return null;
}

/*  When unregistering a listener/handler, what needs to be supplied as the 
    Handler is what was returned from the matching registration.  */

function UnregisterEventHandler (Target, EventName, Handler)
{
    if (Target.removeEventListener != null) {
        Target.removeEventListener (EventName, Handler, false);
    }
    else if (Target.detachEvent != null) {
        Target.detachEvent ("on" + EventName, Handler);
    }
}

/*  --------  */
/*  Handling  */
/*  --------  */

function GetEventSource (Event)
{
    var target = Event.target;
    return target != null ? target : Event.srcElement;
}

function SetEventDone (Event)
{
    if (Event.stopPropagation != null) {
        Event.stopPropagation ();
        Event.preventDefault ();
    }
    else {
        Event.cancelBubble = true;
        Event.returnValue = false;
    }
}

/*  Interpretation of mouse buttons is silly beyond words. Internet Explorer 
    long had a "button" property whose values are bit flags for the possible 
    buttons: 0x01, 0x02, 0x04 for left, right and middle. The standard went 
    with a completely different interpretation: 0, 1 and 2 for left, middle 
    and right. The standard instead exposes Internet Explorer's bit flags as 
    a property named "buttons". 

    There is some sense to this. What Internet Explorer named as button can 
    indeed describe buttons and the standard's button can describe only one. 
    Yet it also looks to be an early sign of Internet Explorer losing from 
    standardisation.  */

function GetEventButtons (Event)
{
    var buttons = Event.buttons;
    return buttons != null ? buttons : Event.button;
}

/*  Events       */
/*  ===========  */
/*  Stylesheets  */

/*  Our other main trouble with browser compatibility is (or was) with 
    stylesheets. 

    TO DO: 

    Ideally, we should need none of this, especially not to add or remove 
    rules. Indeed, only GetRules and GetLastStyleSheet are still in use (and 
    only then from TOC.JS, which is long overdue for a complete reworking).  */

function GetRules (Sheet)
{
    var cssrules = Sheet.cssRules;
    return cssrules != null ? cssrules : Sheet.rules;
}

function GetLastStyleSheet (Window)
{
    if (Window == null) Window = window;
    var sheets = Window.document.styleSheets;
    var numsheets = sheets.length;
    return numsheets != 0 ? sheets [numsheets - 1] : null;
}

/*  Stylesheets  */
/*  ===========  */
/*  Class Names  */

/*  Many pages at this website have HTML tags with a CLASS attribute whose 
    value is one, two or even three space-separated tokens. 
    
    Even the parsing of such a CLASS, let alone its editing, is easier if 
    the browser supports not just the ancient className property but 
    classList too. Internet Explorer apparently got it for version 10 - but 
    even for version 11 the implementation is demonstrably problematic, most 
    obviously for not having the replace method, and less obviously for not 
    interpreting the classList as having no empty or duplicated members. 

    Even when the classList is properly implemented, its utility is lessened 
    for being tied to an element. It's not immediately helpful for working 
    with just a string such as might be (but is not yet) some element's 
    className. 

    The TokenList object defined below is intended as something like the 
    DOMTokenList but for an arbitrary string of space-separated tokens 
    independent of any DOM element. 

    If the browser's JavaScript implementation has a built-in Set object, 
    then some of the TokenList has a straightforward implementation: add, 
    remove and contains from the DOMTokenList map cleanly to the Set's add, 
    delete and has. Some is less straightforward - and the standard anyway 
    was thoughtless to use "delete" for naming a method. Is it worth the 
    trouble? With the trouble taken, is the implementation worth keeping?  */

if (typeof Set == "function" && typeof Set.prototype.forEach == "function") {

    function TokenList (Value, Canonical)
    {
        /*  Cache the initial Value, intending to update it (or save time) 
            whenever the list is retrieved as a string.  */

        this.Value = Value;

        /*  Extract space-separated tokens from the input Value. If our 
            caller assures us that the input is canonical, feed the array of 
            tokens directly into a Set.  */

        var values = Value.split (" ");

        if (Canonical) {

            this.Set = new Set (values);
            this.Dirty = false;
        }
        else {

            /*  More generally, add the tokens one by one to a new Set. 
                Though the Set reliably does not add duplicates, it just as 
                reliably does accept an empty string (such as we'll have in 
                the array of tokens if the input had a doubled space).  */

            var newset = new Set;
            var callback = function (Item) {
                if (Item) newset.add (Item);
            };
            ArrayForEach (values, callback);

            this.Set = newset;
            this.Dirty = newset.size != values.length;
        }
    }

    TokenList.prototype.contains = function (Token) 
    {
        return this.Set.has (Token);
    };

    TokenList.prototype.add = function (Token) 
    {
        var incount = this.Set.size;
        this.Set.add (Token);
        this.Dirty = this.Set.size != incount;
    };

    TokenList.prototype.remove = function (Token) 
    {
        if (this.Set ["delete"] (Token)) this.Dirty = true;
    };

    TokenList.prototype.replace = function (OldToken, NewToken) 
    {
        /*  The Set object does not have an immediate equivalent of the 
            DOMTokenList's replace method. But we can hope that what it does 
            have will be quick to deal with some simple cases. If the Set 
            presently has no OldToken, there's nothing to replace. If the 
            old and new are the same, the replacement is trivial.  */

        if (!this.Set.has (OldToken)) return false;
        if (OldToken == NewToken) return true;

        /*  Ordinarily, with no obvious way to edit the Set's existing 
            members, resort to building a new Set by copying each member 
            except for the replacement. Leave the Set's implementation to 
            sort out whether the replacement or a later addition creates a 
            duplicate and should therefore come to nothing.  */

        var newset = new Set;
        var callback = function (Value) {
            newset.add (Value == OldToken ? NewToken : Value);
        };
        this.Set.forEach (callback);
        this.Set = newset;
        return this.Dirty = true;
    };

    TokenList.prototype.toString = function () 
    {
        if (!this.Dirty) return this.Value;
        var value = "";
        var callback = function (Value) {
            value = value.length == 0 ? Value : value + " " + Value;
        };
        this.Set.forEach (callback);
        this.Dirty = false;
        return this.Value = value;
    };
}
else {

    /*  For old browsers whose JavaScript has no (usable) Set object  */

    function TokenList (Value, Canonical)
    {
        this.Value = Value;

        /*  Extract space-separated tokens from the input Value into an 
            Array but ignore empty tokens and duplicates. This can make do 
            as simulating a Set. If our caller tells us the input Value is 
            canonical, trust the Array.  */

        var values = Value.split (" ");

        if (Canonical) {

            this.Values = values;
            this.Dirty = false;
        }
        else {

            var newvalues = [];
            var callback = function (Item) {
                if (!Item) return;
                if (ArrayIncludes (newvalues, Item)) return;
                newvalues.push (Item);
            };
            ArrayForEach (values, callback);

            this.Values = newvalues;
            this.Dirty = newvalues.length != values.length;
        }
    }

    TokenList.prototype.contains = function (Token) 
    {
        return ArrayIncludes (this.Values, Token);
    };

    TokenList.prototype.add = function (Token) 
    {
        if (ArrayIncludes (this.Values, Token)) return;
        this.Values.push (Token);
        this.Dirty = true;
    };

    TokenList.prototype.remove = function (Token) 
    {
        var n = ArrayIndexOf (this.Values, Token);
        if (n == -1) return;
        this.Values.splice (n, 1);
        this.Dirty = true;
    };

    TokenList.prototype.replace = function (OldToken, NewToken) 
    {
        if (OldToken == NewToken) return this.contains (OldToken);

        /*  The list can contain 0 or 1 of the OldToken and 0 or 1 of the 
            NewToken. Find them. If the enumeration finds one of each, stop. 
            We'll then remove the found element: if the old followed the 
            new, then it is not wanted since the new is in effect the old's 
            replacement; if the new followed the old, then the old will be 
            updated and the new would be an unwanted duplicate.  */

        var iold = null;
        var inew = null;
        var callback = function (Item, Index) {
            if (Item== OldToken) {
                if (inew != null) return true;
                iold = Index;
            }
            else if (Item== NewToken) {
                if (iold != null) return true;
                inew = Index;
            }
            return false;
        };
        var ifound = ArrayFindIndex (this.Values, callback);
        if (ifound != -1) {
            this.Values.splice (ifound, 1);
            this.Dirty = true;
        }

        /*  If there was no old, including because we deleted it for coming 
            after the new, then there's no replacement to make (but a 
            pre-existing new counts as one for what we return).  */

        if (iold == null) return ifound != -1;

        /*  If there was no new, including because we deleted it for coming 
            after the old, replace the old.  */

        if (inew == null) {
            this.Values [iold] = NewToken;
            this.Dirty = true;
        }
        return true;
    };

    TokenList.prototype.toString = function () 
    {
        if (!this.Dirty) return this.Value;
        this.Dirty = false;
        return this.Value = this.Values.join (" ");
    };
}

/*  For old browsers, associate the TokenList with a DOM element so that the 
    token list is the element's className behaving roughly as if the element 
    had a classList.  */

function ClassList (Element, Canonical)
{
    /*  Inherit the TokenList members.  */

    TokenList.call (this, Element.className, Canonical);

    this.Element = Element;
}

/*  Remember that the inheritance of ClassList from TokenList requires 
    initialisation.  */

SetObjectInheritance (ClassList, TokenList);

/*  Extend some of those TokenList methods so that changing the list updates 
    the element's className.  */

ClassList.prototype.Update = function ()
{
    if (this.Dirty) this.Element.className = this.toString ();
};

ClassList.prototype.add = function (Class) 
{
    TokenList.prototype.add.call (this, Class);
    this.Update ();
};

ClassList.prototype.remove = function (Class) {
    TokenList.prototype.remove.call (this, Class);
    this.Update ();
};

ClassList.prototype.replace = function (OldClass, NewClass) {
    var replaced = TokenList.prototype.replace.call (this, OldClass, NewClass);
    if (replaced) this.Update ();
    return replaced;
};

/*  As for whether the browser we're running on actually does implement a 
    usable classList for elements, reject Internet Explorer completely: even 
    its later versions don't trim white space or remove duplicates and 
    anyway don't have the replace method or the value property. 

    The GetClassList and MakeClassList helpers, below, return the given 
    element's classList if it looks to be usable. Otherwise, the former 
    returns null but the latter creates a ClassList for the caller to use 
    instead.  */

function GetClassList (Element)
{
    var classlist = Element.classList;
    return classlist != null 
            && classlist.value != null 
            && classlist.replace != null
        ? classlist 
        : null;
}

function MakeClassList (Element)
{
    var classlist = GetClassList (Element);
    return classlist != null ? classlist : new ClassList (Element);
}

/*  For general use, define some wrappers around the more useful classList 
    methods - but spared from caring whether the given Element actually does 
    have a (usable) classList property.  */

function ElementClassAdd (Element, Class)
{
    return MakeClassList (Element).add (Class);
}

function ElementClassRemove (Element, Class)
{
    return MakeClassList (Element).remove (Class);
}

/*  Class Names  */
/*  ===========  */
/*  Collections  */

/*  Some objects in the DOM have methods or properties that produce 
    collections of elements or nodes. Examples are the getElementsByTagName 
    method and the childNodes property. 

    To old browsers, these collections are array-like objects in that their 
    members can be indexed like those of an array, including that valid 
    indices are subject to a length property. Nowadays, the collections are 
    formalised as an HTMLCollection or a NodeList. The latter may have a 
    forEach method for enumeration. When it seems to exist, prefer it.  */

function CollectionForEach (Collection, Callback, This)
{
    if (Collection.forEach != null) {
        Collection.forEach (Callback, This);
    }
    else {
        var count = Collection.length;
        if (This != null) {
            for (var n = 0; n < count; n ++) {
                Callback.call (This, Collection [n], n, Collection);
            }
        }
        else {
            for (var n = 0; n < count; n ++) {
                Callback (Collection [n], n, Collection);
            }
        }
    }
}

/*  Collections     */
/*  ==============  */
/*  DOM Miscellany  */

/*  Internet Explorer versions before 8.0 have trouble with creating an 
    element and then setting its name property as if it had been an 
    attribute. Microsoft's recommendation back in the day was to set the 
    NAME as an attribute with the tag as HTML when calling createElement.  */

function CreateElementWithName (Document, Tag, Name)
{
    /*  Of course, we don't want to penalise other browsers by making them 
        deal first with Microsoft's non-standard work-around. Create the 
        element normally and set the name normally. Then check (for what we 
        hope is no significant overhead) whether the name shows normally.  */

    var node = Document.createElement (Tag);
    node.name = Name;

    var outerhtml = node.outerHTML;
    if (outerhtml != null && outerhtml.toLowerCase ().indexOf ("name=") == -1) {

        /*  Be sure to wrap the tag and attribute in angle brackets. As 
            Microsoft said of this non-standard createElement: "as long as 
            the entire string is valid HTML."  */

        var e;
        try {
            node = Document.createElement ('<' + Tag + ' name="' + Name + '">');
        }
        catch (e) {
            return null;
        }
    }

    return node;
}

/*  Some few scripts, presently DEMO.JS and TABLESET.JS, extract the text 
    content of a node. The purpose is very narrow, including just to see 
    whether the node is in some sense empty. Neither textContent nor 
    innerText is entirely well suited, the latter especially for triggering 
    a style computation. 

    In the cases of interest, the given Node is expected to contain nothing 
    but text. If the Node contains anything but text nodes, the following 
    helper returns null (meaning there's no simple answer) instead of an 
    empty string.  */

function GetNodeText (Node)
{
    var text = "";
    for (var p = Node.firstChild; p != null; p = p.nextSibling) {
        if (p.nodeType != 3) return null;
        text += p.data;
    }
    return text;
}

/*  DOM Miscellany      */
/*  ==================  */
/*  Deferred Execution  */

/*  These scripts long avoided the knowing of time's passing. This was 
    mostly because the built-in JavaScript support seemed so primitive back 
    in 2007, but was also because there looked to be no compelling need. 

    The reality, of course, is that a script's changes to DOM nodes are much 
    better coordinated with the browser's recalculations of style and 
    layout. Deferring execution to let the browser do this work in its own 
    good time, instead of having to do it synchronously within some event 
    handler, is essential for good performance, at least once content and 
    scripts become complex enough. 

    With this comes a practical need to know how much time has yet been 
    spent on some lengthy operation (the rest of which might then better be 
    deferred). The following helper produces a tick count in milliseconds - 
    intended only for computing differences. 

    Beware that although Internet Explorer 8 gives its window object a 
    member that is named "performance" and may seem to fit the standards, it 
    does not have the expected method named "now".  */

if (window.performance != null && window.performance.now != null) {

    function GetTickCount () {
        return window.performance.now ()
    };
}
else if (Date.now != null) {

    var SimulatedTimeOrigin = Date.now ();

    function GetTickCount () {
        return Date.now () - SimulatedTimeOrigin;
    };
}
else {

    var SimulatedTimeOrigin = (new Date).getTime ();

    function GetTickCount () {
        return (new Date).getTime () - SimulatedTimeOrigin;
    };
}

/*  The modern deferral of execution synchronises with the browser's visible 
    behaviour but needs a fallback on old browsers. Internet Explorer didn't 
    get the new function until version 10. 

    The Callback gets as its one argument a timestamp. It can request 
    another execution, including to re-execute itself. No return value is 
    expected.  */

if (window.requestAnimationFrame != null) {

    function RequestAnimationFrame (Callback) {
        window.requestAnimationFrame (Callback);
    };
}
else {

    /*  The apparently usual practice for simulating requestAnimationFrame 
        on old browsers is to defer for at least as long as the average 
        period at 60 frames per second. 

        TO DO: 

        Some improvement may be possible: an earlier callback more likely 
        than not has some synchronisation, and so the timeout might better 
        be reckoned from then. But is the small gain for old browsers worth 
        any trouble?  */

    var SimulatedAnimationFramePeriod = Math.ceil (1000 / 60);

    function RequestAnimationFrame (Callback) {
        var callback = function () {
            Callback (GetTickCount ());
        };
        window.setTimeout (callback, SimulatedAnimationFramePeriod);
    };
}

/*  Defer for one thing and inevitably we'll want that it too can defer, and 
    so on. 

    For the following "plural" variants of the preceding, successive 
    arguments are callbacks that are to be called in succession, each 
    deferred. The assumption here is that as far as concerns these deferrals 
    the callbacks are self-standing. They do not themselves defer except if 
    they mean to start a separate sequence. 

    An embellishment is that each callback returns a boolean indicator of 
    success or failure, which then means that that deferred execution does 
    or does not proceed to the next callback.  */

function RequestAnimationFrames (/* Callback1, Callback2, ... */)
{
    var count = arguments.length;
    if (count == 0) return;

    var callbacks;

    var arg = arguments [0];
    if (arg instanceof Array) {
        count = arg.length;
        if (count == 0) return;
        callbacks = arg;
    }
    else {
        callbacks = arguments;
    }

    var n = 0;

    var recursive = function () {
        var callback;
        if (-- count == 0) {
            callback = callbacks [n];
        }
        else {
            callback = function (TickCount) {
                var ok = callbacks [n ++] (TickCount);
                if (ok) recursive ();
            };
        };
        RequestAnimationFrame (callback);
    };

    recursive ();
}

/*  TO DO: 

    Provide for scheduling a set of callbacks that can each defer. Each such 
    callback will need to be told of the next callback as the one to 
    schedule on completion. Attempts to date have all got messy quickly.  */

/*  Browser Variations  */
/*  ************************************************************************  */
/*  Browser Utiities */

/*  Some work with browsers doesn't vary much between browsers but seems 
    usefully organised into utility functions for general use.  */

/*  =================  */
/*  Trivial Functions  */

/*  One simple utility is a pair of functions for returning a fixed but 
    trivial result whatever the arguments. These become specially useful for 
    a function that changes its apparent definition because it's actually 
    not a function but a variable that holds a function. When the function 
    should start as if trivial or should become trivial, e.g., when its 
    result is known and will never be re-computed, the variable can simply 
    be set to either of the following.  */

function ReturnFalse (/* any */)
{
    return false;
}

function ReturnTrue (/* any */)
{
    return true;
}

/*  =======  */
/*  Strings  */

/*  Surprisingly many of the opportunities for forgetting to use charAt 
    instead of indexing into a string - all but one in this script - can be 
    hidden behind the following three helpers.  */

function GetLastCharacter (String)
{
    /*  When the input is empty, feeding the out-of-bounds index to charAt 
        produces another empty string as the output.  */

    return String.charAt (String.length - 1);
}

function EnsureLeadingCharacter (String, Leading)
{
    return String.charAt (0) == Leading ? String : Leading + String;
}

function StripLeadingCharacter (String, Leading)
{
    return String.charAt (0) == Leading ? String.substring (1) : String;
}

/*  ===========  */
/*  Class Names  */

/*  For class names merely as strings of space-separated tokens  */

function ClassNameContains (ClassName, Wanted)
{
    switch (ClassName) {

        case "": return false;
        case Wanted: return true;

        default: return ArrayIncludes (ClassName.split (" "), Wanted);
    }
}

function ClassNameAdd (ClassName, Add)
{
    switch (ClassName) {

        case "": return Add;
        case Add: return ClassName;

        default: {
            var tokenlist = new TokenList (ClassName);
            tokenlist.add (Add);
            return tokenlist.toString ();
        }
    }
}

function ClassNameRemove (ClassName, Remove)
{
    switch (ClassName) {
    
        case "": return ClassName;
        case Remove: return "";

        default: {
            var tokenlist = new TokenList (ClassName);
            tokenlist.remove (Remove);
            return tokenlist.toString ();
        }
    }
}

function ClassNameReplace (ClassName, Old, New) 
{
    switch (ClassName) {

        case "": return ClassName;
        case Old: return New;
        case New: return ClassName;

        default: {
            var tokenlist = new TokenList (ClassName);
            var replaced = tokenlist.replace (Old, New);
            return replaced ? tokenlist.toString () : ClassName;
        }
    }
}

/*  For class names from elements  */

function ElementClassContains (Element, Wanted)
{
    return ClassNameContains (Element.className, Wanted);
}

/*  A helper very much for our own need... 

    Given an Element in whose className on input may be any number of 
    occurrences of Wanted (required) and Unwanted (optional), ensure that 
    the className on output has exactly one occurrence of Wanted and none of 
    Unwanted. Return what would be the className with none of either. 

    Previous coding left the className alone except for Wanted and Unwanted. 
    The current implementation has the side-effect of canonicalising the 
    element's className.  */

function ElementClassEnsure (Element, Wanted, Unwanted)
{
    var tokenlist;
    var classlist = GetClassList (Element);
    if (classlist != null) {
        if (Unwanted == null || !classlist.replace (Unwanted, Wanted)) {
            classlist.add (Wanted);
        }
        tokenlist = new TokenList (Element.className, true);
    }
    else {
        tokenlist = new TokenList (Element.className);
        if (Unwanted == null || !tokenlist.replace (Unwanted, Wanted)) {
            tokenlist.add (Wanted);
        }
        if (tokenlist.Dirty) Element.className = tokenlist.toString ();
    }
    tokenlist.remove (Wanted);
    return tokenlist.toString ();
}

/*  Class Names  */
/*  ===========  */
/*  Collections  */

function CollectionFind (Collection, Callback)
{
    var count = Collection.length;
    for (var n = 0; n < count; n ++) {
        var element = Collection [n];
        if (Callback (element, n, Collection)) return element;
    }
    return null;
}

function ExtractFromCollectionByClass (Collection, Class)
{
    var extracted = [];
    var callback = function (Element) {
        if (ElementClassContains (Element, Class)) extracted.push (Element);
    };
    CollectionForEach (Collection, callback);
    return extracted;
}

function FindInCollectionByClass (Collection, Class)
{
    var callback = function (Element) {
        return ElementClassContains (Element, Class);
    };
    return CollectionFind (Collection, callback);
}

/*  Collections  */
/*  ===========  */
/*  Paths        */

/*  Join the Path and Name with a forward slash without duplicating any that 
    is already present at the end of Path or the start of Name.  */

function PathAppend (Path, Name)
{
    if (Path == null) Path = "/";
    if (Name == null) Name = Config.DefaultFilename;

    return GetLastCharacter (Path) == "/"
        ? Path + StripLeadingCharacter (Name, "/")
        : Path + EnsureLeadingCharacter (Name, "/");
}

/*  Paths              */
/*  =================  */
/*  URL Search String  */

/*  A search string may be appended to a page's URL to pass parameters to 
    the page. As parsed for the search property of the location object, it 
    begins with a question mark and is then followed by any number of 
    arguments, separated by & signs. Each argument has the form of a name 
    and value, separated at the first equals sign. 

    The aim here is not to support URL search strings in all their 
    generality, only for what little use we make of them. An argument whose 
    name or value is empty - or whose value that contains an equals sign - 
    is ignored. Though characters in the search string may be escaped, the 
    question mark and the = and & signs should not be, and neither should 
    any name in an argument: if any are, we don't see them. 

    Relatively little of the original functionality is retained nowadays. 
    Here we care only to parse the search string. Editing and reconstitution 
    is needed only by VIEWER.JS to support the old VIEWER.HTM in old URLs. 
    The relevant methods have been moved to VIEWER.JS.  */

/*  A simple object for a single argument in a search string  */

function ParsedSearchArgument (Name, Value)
{
    this.Name = Name;
    this.Value = Value;
}

ParsedSearchArgument.prototype.Match = function (Name)
{
    /*  The name is case-sensitive. Whether this is true too of the 
        corresponding value is up to our caller.  */

    return this.Name == Name ? this.Value : null;
};

/*  A slightly less simple object for the whole search string  */

function ParsedSearch (Search)
{
    var args = [];
    if (Search) {
        var callback = function (Item) {
            var nv = Item.split ("=");
            if (nv.length != 2) return;
            var name = nv [0];
            if (!name) return;
            var value = nv [1];
            if (!value) return;
            args.push (new ParsedSearchArgument (name, value))
        };
        ArrayForEach (
            StripLeadingCharacter (Search, "?").split ("&"),
            callback);
    }
    this.Arguments = args;
}

/*  A method to look up a value by name  */

ParsedSearch.prototype.Get = function (Name)
{
    var value = LookupInArray (
        this.Arguments, 
        ParsedSearchArgument.prototype.Match, 
        Name);
    return value != null ? decodeURIComponent (value) : null;
};

/*  A small elaboration that interprets the value as a boolean  */

ParsedSearch.prototype.GetBoolean = function (Name)
{
    var value = this.Get (Name);
    switch (value) {
        case null: 
        case "0": return false;
        case "1": return true;
    }
    switch (value.toLowerCase ()) {
        case "true":
        case "yes": return true;
    }
    return false;
};

/*  ====  */
/*  URLs  */

/*  Define a LocalUrl object for a URL whose protocol, hostname and port are 
    assumed from the window's location object.  */

/*  First, let's have a helper function that either gets the pathname from a 
    window's location object else ensures that the given Pathname is 
    suitable for use as if it had come from the location object.  */

function EnsurePathnameForLocation (Location, Pathname)
{
    if (Pathname == null) return Location.pathname;
    return EnsureLeadingCharacter (Pathname, "/");
}

/*  The LocalUrl has the protocol and host of the currently loaded document 
    but with different pathname and/or search and hash. All the arguments 
    are optional. The default is that the LocalUrl has the pathname of the 
    currently loaded document but no search or hash.  */

function LocalUrl (Pathname, Search, Hash)
{
    /*  This object has no reason to exist except that we will proceed to 
        build a URL as a string. Even though we don't presently need the 
        protocol, hostname or port until then, it costs no more to get them 
        now - which we'd have to if we ever find an earlier use for them.  */

    var location = window.location;
    this.Protocol = location.protocol;
    this.Host = location.host;

    /*  If the Pathname is the pathname property in a location object, it 
        begins with a forward slash. But if it was obtained as the pathname 
        property of a link, it will typically (and apparently deliberately) 
        not have a leading slash. If absent, insert one so that the 
        difference won't matter to us afterwards and not to our callers at 
        all.  */
    
    this.Pathname = EnsurePathnameForLocation (location, Pathname);

    /*  The Search and Hash arguments are optional. If they are given, then 
        whether they come from a location object or a link, they will start 
        with a "?" or "#" - but insert one if absent.  */

    this.Search = Search ? EnsureLeadingCharacter (Search, "?") : "";
    this.Hash = Hash ? EnsureLeadingCharacter (Hash, "#") : "";
}

/*  A method to append a Name and Value as an argument for the URL's search 
    string

    The Name and Value must not use characters (such as the % sign) that 
    would need to be escaped. No check is made for whether the URL search 
    string already has a Name argument.  */

LocalUrl.prototype.AppendSearch = function (Name, Value)
{
    this.Search += (this.Search == "" ? "?" : "&") + Name + "=" + Value;
};

/*  A method to extract a full URL - well, as full as we ever need - from a 
    LocalUrl  */

LocalUrl.prototype.toString = function ()
{
    return this.Protocol + "//" + this.Host 
        + this.Pathname + this.Search + this.Hash;
};

/*  Often, all we want is the URL of the currently loaded document but with 
    a different Pathname and no search or hash. We don't need the LocalUrl 
    object for this simple case. Just build the URL as a string.  */

function ComposeLocalUrl (Pathname)
{
    var location = window.location;
    return location.protocol + "//" + location.host 
        + EnsurePathnameForLocation (location, Pathname);
}

/*  Browser Utilities  */
/*  *****************  */
/*  Site Properties    */

function ComposeCanonicalDomain (HostName)
{
    if (HostName == Config.LiveDomain) return HostName;

    var base = Config.BaseDomain;
    if (HostName == base) return HostName;

    var subdomains = HostName.split (".");
    for (var n = subdomains.length; n != 0; n --) {
        if (subdomains.shift () == base) {
            return n > 1 ? "www." + base + "." + subdomains.join (".") : base;
        }
    }
    return null;
}

function ComposeCanonicalUrl (Window)
{
    if (Window == null) Window = window;
    
    var location = Window.location;
    
    var hostname = ComposeCanonicalDomain (location.hostname.toLowerCase ());
    if (hostname == null) return null;
    
    var pathname = location.pathname.toLowerCase ();
    if (GetLastCharacter (pathname) == "/") pathname += Config.DefaultFilename;
    
    return "https://" + hostname + pathname;
}

/*  =======  */
/*  Subwebs  */

var GetCurrentSubweb = function () {
    return null;
};

function GetSubweb (Pathname)
{
    /*  The argument can be null to find the subweb for the currently loaded 
        document. Indeed, when this is what's wanted, calling with null is 
        the efficient way since the result is cached.  */

    if (Pathname == null) {
        var currentsubweb = GetCurrentSubweb ();
        if (currentsubweb == null) {
            currentsubweb = GetSubweb (window.location.pathname);
            GetCurrentSubweb = function () {
                return currentsubweb;
            };
        }
        return currentsubweb;
    }

    /*  Save our caller from having to worry whether the Pathname begins with 
        a slash.  */

    Pathname = EnsureLeadingCharacter (Pathname, "/");

    /*  Find the subweb for this possibly defaulted or edited pathname.  */

    var subweb = FindInArray (
        Config.Subwebs, 
        Config.Subweb.prototype.Match, 
        Pathname.toLowerCase ());
    return subweb != null ? subweb : Config.HomeSubweb;

}

function GetSubwebPath (Pathname)
{
    return GetSubweb (Pathname).Path;
}

function GetSubwebName (Pathname)
{
    return GetSubweb (Pathname).Name;
}

/*  Subwebs                */
/*  =====================  */
/*  Local Link Redirecton  */

/*  THINK: 
    
    Would some or even all of this section, which depends on the Viewer 
    object, be more appropriately in DOCUMENT.JS? 

    Also, might this better be reworked into a LocalLink object that 
    inherits from the more general LocalUrl?  */

LocalUrl.prototype.CarryNoScript = function (Arguments)
{
    var carried = Config.UrlArguments.NoScript;
    if (!Arguments.GetBoolean (carried)) {
        carried = Config.UrlArguments.NoViewer;
        if (!Arguments.GetBoolean (carried)) return null;
    }
    this.AppendSearch (carried, "true");
    return carried;
}

/*  Links within the site preserve state by passing it in the URL search 
    string. Whenever a local link looks likely to be followed, edit it. 

    TO DO: move to DOCUMENT.JS?  */

LocalUrl.prototype.LoadPersistentState = function ()
{
    /*  What needs to persist is the state of the viewer as the user 
        navigates around the site. If there's no viewer, keep the navigation 
        going as if scripts don't run. Ordinarily, there is a viewer, and it 
        controls the collection of state.  */

    if (typeof Viewer == "function" 
            && typeof Viewer.LoadPersistentState == "function") {
        Viewer.LoadPersistentState (this);
        return;
    }
    this.AppendSearch (Config.UrlArguments.NoViewer, "true");
};

/*  Call the following only after establishing that the link is local.  */

function RedirectLocalLink (Link)
{
    var pathname = Link.pathname;

    /*  A handful of links are intended to have some limited effect, and 
        anyway not to result in navigation that preserves state. What 
        distinguishes these is that the target's filename begins with an 
        underscore. 

        TO DO: Does any actual use of this remain?  */

    if (pathname.indexOf ("/_") != -1) return;

    var localurl = new LocalUrl (pathname, null, Link.hash);

    var carried = localurl.CarryNoScript (new ParsedSearch (Link.search));
    if (carried == null) localurl.LoadPersistentState ();

    Link.href = localurl;

    /*  Long ago, all intended access to the site went through VIEWER.HTM, 
        selecting different document pages by varying the URL search string. 
        The less said the better, perhaps, but it did have one advantage in 
        terms of speed: a link in the banner or TOC could specify the 
        document frame as its target, so that the banner and/or TOC did not 
        need to be reloaded. 

        This is all long gone. All links to document pages elsewhere in the 
        site must seek to load the document page into a top window (whether 
        the one that's already in use or for a new tab or new browser). 
        Force this target. Omitting it here isn't fatal, since DOCUMENT.JS 
        in the newly loaded page will catch that it's in a frame, but 
        reloading the page into the top window then is very inefficient.  */

    if (Link.target == "") Link.target = carried != null ? "_blank" : "_top";
}

/*  Most often best is to redirect a local link whenever the user looks like 
    thinking to follow it, as when clicking on a link (which does follow it, 
    by default) or double-clicking (for options about following it). This 
    can happen in the document or in either IFRAME.  */

function RedirectClickedLink (Event, Element)
{
    for (var p = GetEventSource (Event); p != null; p = p.parentNode) {

        /*  We're interested only in the first link we come to as we work up 
            through the tree. Even then, we do something only for links 
            within the site.  */

        if (p.nodeName == "A") {

            /*  TO DO: 

                Can it ever be that we get here but the A was not the event 
                source?  */

            if (p.hostname == window.top.location.hostname) {
                RedirectLocalLink (p);
            }
            return;
        }

        /*  There's no point going further up than whatever element the 
            event handler is set on.  */

        if (p == Element) return;
    }
}

/*  Call the following from any document or either IFRAME to ensure that 
    if any link within the site is clicked, it gets edited for state 
    preservation if navigation proceeds.  */

function SetClickedLinkRedirection (Element)
{
    /*  The caller's aim should be that handlers are set for click and 
        contextmenu events on the tightest container of all links that are 
        to be affected.  */

    var handler = function (Event) {
        RedirectClickedLink (Event, Element);
    };

    RegisterEventHandler (Element, "click", handler);
    RegisterEventHandler (Element, "contextmenu", handler);
}

/*  Site Properties       */
/*  ********************  */
/*  Selective Visibility  */

/*  All pages, not just document pages but TOC.HTM and BANNER.HTM too, are 
    written for some re-styling in common if scripts run. The applicable 
    classes are defined here in MASTER.JS and are styled in MASTER.CSS. 

/*  ====================  */
/*  Lasting Invisibility  */

/*  All HTML at this site is written and styled for when scripts don't run, 
    this being the configuration that has no opportunity for re-styling. If 
    scripts do run, they hide anything that is meant to be seen only when 
    scripts don't run. 

    This is now done by styling the HTML element. That scripts have run is 
    known to the stylesheets because the HTML node gets Scripted added to 
    its CLASS. Note that this means the following function can have a wider 
    effect than is suggested by its name or by the preceding paragraph. 

    WORK IN PROGRESS: 

    This anyway is changing in favour of managing Scripted jointly with 
    UnderConstruction - see below.  */

function HideNoScriptBlocks (Window)
{
    ElementClassAdd (
        Window.document.documentElement, 
        Config.Classes.Scripted);
}

function UnhideNoScriptBlocks (Window)
{
    ElementClassRemove (
        Window.document.documentElement, 
        Config.Classes.Scripted);
}

/*  ----------  */
/*  Simulation  */
/*  ----------  */

/*  Astonishingly, if only to me, some browsers do not help with disabling 
    scripts - even for all sites, let alone for some specified selection. 
    Perhaps no real-world users care, but the author of this script does. 

    Two URL search string arguments indicate a preference not to run 
    scripts regardless of what the browser allows. One tells the scripts to 
    give up as completely as they can. The other tells them to run them just 
    enough to carry a very similar effect from page to page. 

    Configure just the once, from DOCUMENT.JS, having parsed the URL search 
    string into a ParsedSearch (see above). 

    TO DO: Perhaps move (back) to DOCUMENT.JS.  */

var IsNoScript = ReturnFalse;

function ConfigureNoScript (Search) 
{
    var urlargs = Config.UrlArguments;
    if (!Search.GetBoolean (urlargs.NoScript)) {
        if (!Search.GetBoolean (urlargs.NoViewer)) return false;

        /*  The only difference with noviewer=on instead of noscript=on is 
            that we persist beyond our global initialisation in the form of 
            event handlers for clicking on links. The handlers edit the 
            clicked link so that noviewer=on persists across the 
            navigation.  */

        SetClickedLinkRedirection (window.document);
    }

    /*  With either noscript=on or noviewer=on, we do nothing or very little 
        beyond our own first execution and we record that nobody else is to, 
        either.  */

    IsNoScript = ReturnTrue;

    return true;
}

/*  ======================  */
/*  Temporary Invisibility  */

/*  Both the viewer's construction (DOCUMENT.JS) and the TOC's initial 
    expansion (TOC.JS) do more than a little violence to the layout. It 
    helps to provide both with the same means of hiding what they're working 
    on until they're ready to reveal. 

    Construct a ConstructionHider to hide the given Window, from its HTML 
    node down. Then call the Transfer method to transfer this hiding to 
    another element, e.g., further down the tree. Call Reveal to undo the 
    hiding altogether.  */

function ConstructionHider (Window)
{
    var html = Window.document.documentElement;
    html.className = ClassNameAdd (
        ClassNameAdd (html.className, Config.Classes.Scripted), 
        Config.Classes.UnderConstruction);
    this.Html = html;
    this.Element = html;
}

ConstructionHider.prototype.Transfer = function (Element) 
{
    if (this.Element == null) return;
    ElementClassAdd (Element, Config.Classes.UnderConstruction);
    ElementClassRemove (this.Element, Config.Classes.UnderConstruction);
    this.Element = Element;
};

ConstructionHider.prototype.Reveal = function (NoScript) 
{
    if (this.Element != null) {
        ElementClassRemove (this.Element, Config.Classes.UnderConstruction);
        this.Element = null;
    }
    if (NoScript) ElementClassRemove (this.Html, Config.Classes.Scripted);
};

/*  Selective Visibility  */
/*  ********************  */
/*  External Access       */

/*  Whatever the browser, there is minimal functionality that we assume and 
    some more functionality that we explicitly require.  */

var IsBadBrowser = function (Window)
{
    /*  These particular tests are at best historical. They date from 2007 
        when deciding that script to supply the built-in Array object with 
        methods it lacks in Internet Explorer 5 was not worth its space. 

        That said, although server logs even in 2021 show only a handful of 
        hits per month from Windows 2000, hits from Windows 98 still run at 
        a few percent. I suspect that the latter has the attention of 
        hobbyists. Though they are not running the Internet Explorer 4 that 
        came with Windows 98, some orderly reversion to basics for very old 
        browsers arguably is still worth troubling over. 

        These Array methods are all said by Microsoft to date from the 
        JSCRIPT.DLL version 5.5 that was distributed Internet Explorer 5.5, 
        i.e., Windows Me but not Windows 2000.  */

    var bad = Array.prototype.push == null 
        || Array.prototype.shift == null 
        || Array.prototype.splice == null 
        || Function.prototype.call == null;

    IsBadBrowser = bad ? ReturnTrue : ReturnFalse;

    return bad;
}

/*  For reasons noted above, under Configuration, we let the scripts run 
    non-trivially only for known hosts.  */

var IsBadHost = function (Window) {

    /*  The expected first use is from DOCUMENT.JS before the viewer gets 
        constructed and thus long before our own scripts have created any 
        frames in which to run any other scripts.  */

    if (Window != window) return true;

    /*  For the parsing, use a regular expression - not that any regular 
        expression has yet been found to give better performance than what 
        can be done just with the browser's ordinary support for strings.  */

    var hostname = window.location.hostname;
    var bad = hostname != Config.LiveDomain 
        && hostname != Config.BaseDomain 
        && !Config.RecognisedHostName.test (hostname);

    /*  Having got our answer, one way or another, we never need re-evaluate 
        for the top window. Otherwise, we want that all our windows have the 
        same host.  */

    if (bad) {
        IsBadHost = ReturnTrue;
    }
    else {
        IsBadHost = function (Window) {
            return Window != window 
                ? Window.location.hostname != window.location.hostname 
                : false;
        };
    }

    return bad;
}

/*  We may as well get those bad referrers out of the way too. They're 
    configured here in MASTER.JS as site properties even though we only 
    act on them from DOCUMENT.JS.  */

function LookupBadReferrer (Window)
{
    var ref = Window.document.referrer;
    if (ref == null) return null;

    return LookupInArray (
        Config.BadReferrers, 
        Config.BadReferrer.prototype.Match, 
        ref);
}

/*  We don't want to make a mess if the user runs scripts selectively. Yes, 
    they would likely know they're making mischief, but if they're testing 
    whether our scripts are safe to run, let's at least try not to confirm 
    their suspicions. 

    Other scripts test that the following is defined as a function and then 
    call it for assurance that other functions they might want to call from 
    MASTER.JS are available. 

    This has developed into a wider test of whether any script proceeds 
    beyond its initial execution. These other scripts and this script can be 
    executing in different windows. Just to call us, a caller in a different 
    window must know that we're in their top window. Wherever the caller 
    runs, the caller tells us their window.  */

function IsMasterJsGood (Window)
{
    return Window.top == window
        && !IsNoScript () 
        && !IsBadBrowser (Window) 
        && !IsBadHost (Window);
}

/*  ************************************************************************  *
 *        Copyright © 2007-2022. Geoff Chappell. All rights reserved.         *
 *  ************************************************************************  */

//-->