package com.portfolio.metals.repository;

import com.portfolio.metals.model.MetalRates;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for MetalRates singleton.
 */
@Repository
public interface MetalRatesRepository extends JpaRepository<MetalRates, Long> {
}
