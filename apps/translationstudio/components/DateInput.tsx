/*
Contentful - translationstudio extension
Copyright (C) 2025 I-D Media GmbH, idmedia.com

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 2
of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, see https://www.gnu.org/licenses/old-licenses/gpl-2.0.html
*/
import React from "react";

// Styles taken from th page since there is no F36 Input type date
const style = {
	outline: "none",
	boxShadow: "rgba(225, 228, 232, 0.2) 0px 2px 0px inset",
	// boxSizing: "border-box",
	backgroundColor: "rgb(255, 255, 255)",
	border: "1px solid rgb(207, 217, 224)",
	color: "rgb(65, 77, 99)",
	margin: "0px",
	width: "100%",
	zIndex: 1,
	borderRadius: "6px",
	lineHeight: "1.25rem",
	fontSize: "0.875rem",
	padding: "10px 0.75rem",
	minHeight: "40px",
	maxHeight: "40px",
	marginBottom: "10px"
};
const DateInput = (props: React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>) => <input type="date" {...props} style={style} />;
export default DateInput;
