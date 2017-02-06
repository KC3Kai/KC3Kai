#!/usr/bin/perl

=pod

This script is for updating "src/data/icons.json"
by collecting icon files under "src/assets/ships" and "src/assert".

You can execute this file under any non-npm subdirectory of KC3Kai.

=cut

use strict;
use warnings;
use v5.10;

sub find_project_root {
	my $pkgloc = "./";
	my $retry = 10;

	while (! -e $pkgloc . "package.json" and $retry > 0) {
		$pkgloc = "../" . $pkgloc;
		-- $retry;
	}

	die "project root not found" if ! -e $pkgloc . "package.json";
	$pkgloc;
}

my $prj_root = find_project_root();

sub scan_icon_dir {
	my $dir = shift;
	opendir(my $dh, $dir);
	my @xs = sort {$a <=> $b} grep {s/^(.*)\.png$/$1/gi} readdir($dh);
	closedir $dh;
	@xs;
}

my $shipLine = join ", ", scan_icon_dir($prj_root . "src/assets/img/ships");
my $abyssLine = join ", ", scan_icon_dir($prj_root . "src/assets/img/abyss");

open(my $fh, ">", $prj_root . "src/data/icons.json");
print $fh <<ICONS_FILE;
[
$shipLine,
$abyssLine
]
ICONS_FILE
close $fh;
