package com.portfolio.metals.repository;

import com.portfolio.metals.model.Asset;
import com.portfolio.metals.model.AssetType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA repository for Asset entities.
 */
@Repository
public interface AssetRepository extends JpaRepository<Asset, Long> {

    List<Asset> findByUserIdOrderByDisplayOrderAscIdDesc(String userId);

    List<Asset> findByUserIdAndAssetTypeOrderByDisplayOrderAscIdDesc(String userId, AssetType assetType);

    void deleteByUserId(String userId);
}
