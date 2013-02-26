

module("g2g");
test("g2g.GraphComponent", function() {
	d3.select("#qunit-fixture")
		.append("svg:svg")
		.attr("id", "graphtest");
	var svg = d3.select("#graphtest").append("g");
	ok(new g2g.GraphComponent(svg), "Need a valid SVG parent element");
	ok(new g2g.GraphComponent(svg).getNode());
	var gc = new g2g.GraphComponent(svg, 10, 10);
	deepEqual(gc.getXY(), {x:10, y:10});
	strictEqual(gc.draw().setVisible(true).select(true), gc);

});

test("g2g.Link", function() {
	d3.select("#qunit-fixture")
		.append("svg:svg")
		.attr("id", "graphtest");
	var svg = d3.select("#graphtest").append("g");
	ok(new g2g.Link(svg));
	ok(new g2g.Link(svg).getNode());
	var link = new g2g.Link(svg);
	var elt1 = new g2g.GraphComponent(svg, 10, 10);
	var elt2 = new g2g.GraphComponent(svg, 20, 20);
	strictEqual(link.addElement(elt1), link);
	strictEqual(link.addElement(elt2), link);
	strictEqual(link.close(), link);
	equal(link.elements.length, 2);
	strictEqual(link.draw(), link);
});

test("g2g.Options", function() {
	ok(new g2g.Options());
	var opts = {o1: "1", o2: "2"};
	ok(new g2g.Options(opts));
	equal(new g2g.Options(opts).o1, opts.o1);
	equal(new g2g.Options(opts).o2, opts.o2);
	var opts2 = new g2g.Options(opts);
	opts2.change("o1", 3);
	equal(opts2.o1, 3);
});
;
module("ias");
test("ias.filter", function() {
	ok(true);
});
