import React from 'react';
import Empty from '../../assets/images/svg/empty.svg?react';

const EmptyComp = () => {
    return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "140px" }}>
            <div>
                <Empty />
                <div style={{ textAlign: "center" }}>

                    <h3 style={{ fontWeight: "bold", paddingLeft: "30px" }}>Sorry! no result found</h3>
                    <p style={{
                        color: "#9C9B9B"
                    }}>please try searching with another term</p>
                </div>

            </div>
        </div>
    );
};

export default EmptyComp;
